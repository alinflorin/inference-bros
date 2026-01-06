# Install first master
resource "ssh_sensitive_resource" "install_k3s_first_master" {
  host        = local.first_master.ip
  user        = local.first_master.user
  port        = local.first_master.port
  agent       = false
  private_key = var.ssh_private_key

  when = "create"

  triggers = {
    
  }

  file {
    content = <<-EOT
      #!/bin/sh
      mount --make-rshared /
    EOT

    destination = "/etc/local.d/mount.rshared.start"
    permissions = "0755"
  }

  file {
    content = var.root_ca_crt
    destination = "/var/lib/rancher/k3s/server/tls/root-ca.pem"
    permissions = "0700"
  }

  file {
    content = var.root_ca_key
    destination = "/var/lib/rancher/k3s/server/tls/root-ca.key"
    permissions = "0700"
  }

  file {
    content = <<-EOT
      write-kubeconfig-mode: "0644"
      node-ip: ${local.first_master.ip}
      flannel-iface: ${local.first_master.iface}
      flannel-backend: "vxlan"
      node-name: ${local.first_master.hostname}
      tls-san:
        - ${local.first_master.ip}
        - ${var.k3s_vip}
        - k3s.${var.domain}
      disable:
        - servicelb
        - traefik
        - local-storage
      kube-apiserver-arg:
        - "oidc-issuer-url=https://dex.${var.domain}"
        - "oidc-client-id=k3s"
        - "oidc-username-claim=email"
        - "oidc-groups-claim=groups"
        ${var.location == "local" ? "- \"oidc-ca-file=/var/lib/rancher/k3s/server/tls/root-ca.pem\"" : ""}
      cluster-init: true
    EOT

    destination = "/etc/rancher/k3s/config.yaml"
    permissions = "0700"
  }

  timeout = "20m"

  pre_commands = [
    "mkdir -p /etc/rancher/k3s",
    "mkdir -p /var/lib/rancher/k3s/server/tls",
  ]

  commands = [
    "mount --make-rshared /",
    "rc-update add local default",
    "apk update",
    "apk add curl jq iptables open-iscsi",
    "echo '${var.nginx_metallb_ip} dex.${var.domain}' | tee -a /etc/hosts",
    "curl -sL https://github.com/k3s-io/k3s/raw/main/contrib/util/generate-custom-ca-certs.sh | sh -",
    "curl -sfL https://get.k3s.io | sh -",
    "sleep 30",
    "k3s kubectl create namespace cert-manager",
    "k3s kubectl create secret generic root-ca --from-file=tls.crt=/var/lib/rancher/k3s/server/tls/root-ca.pem --from-file=tls.key=/var/lib/rancher/k3s/server/tls/root-ca.key -n cert-manager",
    <<-EOCMD
      jq -n \
        --arg token "$(cat /var/lib/rancher/k3s/server/token)" \
        --arg kubeconfig "$(base64 /etc/rancher/k3s/k3s.yaml | tr -d '\n')" \
        '{token: $token, kubeconfig_b64: $kubeconfig}'
    EOCMD
  ]

  depends_on = [ssh_sensitive_resource.destroy_k3s_all]
}

locals {
  k3s_token = jsondecode(
    ssh_sensitive_resource.install_k3s_first_master.result
  ).token
  k3s_kubeconfig = replace(base64decode(jsondecode(
    ssh_sensitive_resource.install_k3s_first_master.result
  ).kubeconfig_b64), "127.0.0.1", local.first_master.ip)
  k3s_kubeconfig_url    = "https://${local.first_master.ip}:6443"
  k3s_kubeconfig_object = yamldecode(local.k3s_kubeconfig)
  k3s_kubeconfig_for_users = <<-EOT
    apiVersion: v1
    clusters:
    - cluster:
        certificate-authority-data: ${local.k3s_kubeconfig_object.clusters[0].cluster.certificate-authority-data}
        server: https://k3s.${var.domain}:6443
      name: k3s-${var.location}
    contexts:
    - context:
        cluster: k3s-${var.location}
        user: oidc
      name: k3s-${var.location}
    current-context: k3s-${var.location}
    kind: Config
    preferences: {}
    users:
    - name: oidc
      user:
        exec:
          apiVersion: client.authentication.k8s.io/v1beta1
          args:
          - oidc-login
          - get-token
          - --oidc-issuer-url=https://dex.${var.domain}
          - --oidc-client-id=k3s
          - --oidc-extra-scope=openid
          - --oidc-extra-scope=profile
          - --oidc-extra-scope=email
          - --oidc-extra-scope=offline_access
          ${var.location == "local" ? "- --insecure-skip-tls-verify" : ""}
          command: kubectl
          env: null
          provideClusterInfo: false
  EOT

}

# Install kube-vip on first master
resource "helm_release" "kube_vip" {
  name       = "kube-vip"
  repository = "https://kube-vip.github.io/helm-charts/"
  chart      = "kube-vip"
  namespace  = "kube-system"
  version = "0.9.3"
  create_namespace = true
  atomic          = true
  wait            = true

  values = [
    <<-EOT
      config:
        address: "${var.k3s_vip}"

      env:
        vip_interface: "${local.first_master.iface}"
        vip_arp: "true"
        lb_enable: "true"
        lb_port: "6443"
        vip_subnet: "32"
        cp_enable: "true"
        svc_enable: "false"
        svc_election: "false"
        vip_leaderelection: "false"

      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-role.kubernetes.io/master
                operator: Exists
            - matchExpressions:
              - key: node-role.kubernetes.io/control-plane
                operator: Exists
    EOT

  ]

  depends_on = [ssh_sensitive_resource.install_k3s_first_master]
}

resource "helm_release" "coredns_custom_config" {
  name       = "coredns-custom-config"
  repository = "https://dasmeta.github.io/helm/"
  chart      = "resource"
  namespace  = "kube-system"
  create_namespace = true
  version = "0.1.0"
  atomic          = true
  wait            = true

  values = [
    <<-EOT
      resource:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: coredns-custom
          namespace: kube-system
        data:
          ${var.domain}.override: |
            template IN A ${var.domain} {
                match (.*)\.${replace(var.domain, ".", "\\.")}
                answer "{{.Name}} 60 IN A ${var.nginx_metallb_ip}"
            }

    EOT

  ]

  depends_on = [ssh_sensitive_resource.install_k3s_first_master]
}

# Install other masters
resource "ssh_sensitive_resource" "install_k3s_other_masters" {
  for_each = {
    for s in local.other_masters : s.hostname => s
  }

  triggers = {
    
  }

  host        = each.value.ip
  user        = each.value.user
  port        = each.value.port
  agent       = false
  private_key = var.ssh_private_key

  when = "create"

  file {
    content = <<-EOT
      #!/bin/sh
      mount --make-rshared /
    EOT
    
    destination = "/etc/local.d/mount.rshared.start"
    permissions = "0755"
  }

  file {
    content = var.root_ca_crt
    destination = "/var/lib/rancher/k3s/server/tls/root-ca.pem"
    permissions = "0700"
  }

  file {
    content = var.root_ca_key
    destination = "/var/lib/rancher/k3s/server/tls/root-ca.key"
    permissions = "0700"
  }

  file {
    content = <<-EOT
      write-kubeconfig-mode: "0644"
      node-ip: ${each.value.ip}
      flannel-iface: ${each.value.iface}
      flannel-backend: "vxlan"
      node-name: ${each.value.hostname}
      tls-san:
        - ${each.value.ip}
        - ${var.k3s_vip}
        - k3s.${var.domain}
      disable:
        - servicelb
        - traefik
        - local-storage
      kube-apiserver-arg:
        - "oidc-issuer-url=https://dex.${var.domain}"
        - "oidc-client-id=k3s"
        - "oidc-username-claim=email"
        - "oidc-groups-claim=groups"
        ${var.location == "local" ? "- \"oidc-ca-file=/var/lib/rancher/k3s/server/tls/root-ca.pem\"" : ""}
      server: https://${var.k3s_vip}:6443
      token: ${local.k3s_token}
    EOT

    destination = "/etc/rancher/k3s/config.yaml"
    permissions = "0700"
  }

  timeout = "20m"

  pre_commands = [
    "mkdir -p /etc/rancher/k3s",
    "mkdir -p /var/lib/rancher/k3s/server/tls",
  ]

  commands = [
    "mount --make-rshared /",
    "rc-update add local default",
    "apk update",
    "apk add curl jq iptables open-iscsi",
    "echo '${var.nginx_metallb_ip} dex.${var.domain}' | tee -a /etc/hosts",
    "curl -sL https://github.com/k3s-io/k3s/raw/main/contrib/util/generate-custom-ca-certs.sh | sh -",
    "curl -sfL https://get.k3s.io | sh -",
    "echo OK",
  ]

  depends_on = [helm_release.kube_vip]
}



# Install workers
resource "ssh_sensitive_resource" "install_k3s_workers" {
  for_each = {
    for s in local.workers : s.hostname => s
  }

  triggers = {
    
  }

  host        = each.value.ip
  user        = each.value.user
  port        = each.value.port
  agent       = false
  private_key = var.ssh_private_key

  when = "create"

  file {
    content = <<-EOT
      #!/bin/sh
      mount --make-rshared /
    EOT
    
    destination = "/etc/local.d/mount.rshared.start"
    permissions = "0755"
  }

  file {
    content = <<-EOT
      node-ip: ${each.value.ip}
      node-name: ${each.value.hostname}
      server: https://${var.k3s_vip}:6443
      token: ${local.k3s_token}
    EOT

    destination = "/etc/rancher/k3s/config.yaml"
    permissions = "0700"
  }

  timeout = "20m"

  pre_commands = [
    "mkdir -p /etc/rancher/k3s",
  ]

  commands = [
    "mount --make-rshared /",
    "rc-update add local default",
    "apk update",
    "apk add curl jq iptables open-iscsi",
    "curl -sfL https://get.k3s.io | sh -s - agent",
    "echo OK",
  ]

  depends_on = [helm_release.kube_vip]
}


// Destroy all on tf destroy command
resource "ssh_sensitive_resource" "destroy_k3s_all" {
  for_each = {
    for s in var.servers : s.hostname => s
  }

  host        = each.value.ip
  user        = each.value.user
  port        = each.value.port
  agent       = false
  private_key = var.ssh_private_key

  when = "destroy"

  timeout = "15m"

  commands = [
    "(k3s-killall.sh || true) && (k3s-uninstall.sh || true) && (k3s-agent-uninstall.sh || true) && (rm -rf /etc/rancher /var/lib/rancher /root/install_k3s.sh /var/log/k3s* /var/lib/longhorn /var/lib/containerd || true)",
  ]
}

resource "null_resource" "k3s_installed" {
  depends_on = [ 
    ssh_sensitive_resource.install_k3s_first_master,
    ssh_sensitive_resource.install_k3s_other_masters,
    ssh_sensitive_resource.install_k3s_workers
  ]
}