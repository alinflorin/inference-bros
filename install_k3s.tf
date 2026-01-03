# Install first master
resource "ssh_sensitive_resource" "install_k3s_first_master" {
  host        = local.first_master.ip
  user        = local.first_master.user
  port        = local.first_master.port
  agent        = false
  private_key = var.ssh_private_key
  
  when = "create"

  file {
    content     = <<-EOT
      write-kubeconfig-mode: "0644"
      node-ip: ${local.first_master.ip}
      flannel-iface: ${local.first_master.iface}
      node-name: ${local.first_master.hostname}
      tls-san:
        - ${local.first_master.ip}
        - ${var.k3s_vip}
        - k3s.${var.domain}
        - k3s-ha.${var.domain}
        - k3s
        - k3s-ha
      disable:
        - servicelb
        - traefik
        - local-storage
      cluster-init: true
    EOT

    destination = "/etc/rancher/k3s/config.yaml"
    permissions = "0700"
  }

  timeout = "20m"

  pre_commands = [
    "mkdir -p /var/lib/rancher/k3s/server/tls",
    "mkdir -p /etc/rancher/k3s",
  ]

  commands = [
    "apk update",
    "apk add curl jq",
    "curl -sfL https://get.k3s.io | sh -",
    "sleep 30",
    <<-EOCMD
      jq -n \
        --arg token "$(cat /var/lib/rancher/k3s/server/token)" \
        --arg kubeconfig "$(base64 /etc/rancher/k3s/k3s.yaml | tr -d '\n')" \
        '{token: $token, kubeconfig_b64: $kubeconfig}'
    EOCMD
  ]
}

locals {
  k3s_token = jsondecode(
    ssh_sensitive_resource.install_k3s_first_master.result
  ).token
  k3s_kubeconfig = replace(base64decode(jsondecode(
    ssh_sensitive_resource.install_k3s_first_master.result
  ).kubeconfig_b64), "127.0.0.1", local.first_master.ip)
  k3s_kubeconfig_url = "https://${local.first_master.ip}:6443"
  k3s_kubeconfig_object = yamldecode(local.k3s_kubeconfig)
}


# Install kube-vip on first master




// Destroy all
resource "ssh_sensitive_resource" "destroy_k3s_all" {
  for_each = {
    for s in var.servers : s.hostname => s
  }

  host        = each.value.ip
  user        = each.value.user
  port        = each.value.port
  agent        = false
  private_key = var.ssh_private_key
  
  when = "destroy"

  timeout = "15m"

  commands = [
    "(k3s-killall.sh || true) && (k3s-uninstall.sh || true) && (k3s-agent-uninstall.sh || true) && (rm -rf /etc/rancher /var/lib/rancher /root/install_k3s.sh || true)",
  ]
}