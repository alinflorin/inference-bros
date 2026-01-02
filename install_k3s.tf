resource "ssh_sensitive_resource" "install_k3s_first_master" {
  host        = local.first_master.ip
  user        = local.first_master.user
  port        = local.first_master.port
  agent        = false
  private_key = var.ssh_private_key
  
  when = "create"

  file {
    content     = var.root_ca_crt
    destination = "/var/lib/rancher/k3s/server/tls/root-ca.pem"
    permissions = "0700"
  }

  file {
    content     = var.root_ca_key
    destination = "/var/lib/rancher/k3s/server/tls/root-ca.key"
    permissions = "0700"
  }

  file {
    content     = templatefile("${path.module}/files/k3s_config_first_master.yaml.tpl",
      {
        ip       = local.first_master.ip
        iface = local.first_master.iface
        hostname = local.first_master.hostname
        vip = var.k3s_vip
        domain = var.domain
      }
    )
    destination = "/etc/rancher/k3s/config.yaml"
    permissions = "0700"
  }

  file {
    content     = file("${path.module}/files/install_k3s.sh")
    destination = "/root/install_k3s.sh"
    permissions = "0700"
  }

  timeout = "20m"

  pre_commands = [
    "mkdir -p /var/lib/rancher/k3s/server/tls",
    "mkdir -p /etc/rancher/k3s",
  ]

  commands = [
    "/root/install_k3s.sh first-master",
  ]
}






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