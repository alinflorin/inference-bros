servers = [
  {
    ip       = "192.168.0.101"
    port     = 22
    user     = "root"
    master   = true
    hostname = "k3s-master-1"
    iface    = "eth0"
  }
]
k3s_vip       = "192.168.0.252"
metallb_range = "192.168.0.240-192.168.0.249"
nginx_metallb_ip = "192.168.0.240"
domain        = "pr.inferencebros.com"

ssh_private_key = <<EOF
...
EOF

ssh_public_key = <<EOF
...
EOF


letsencrypt_email = "..."
location          = "pr"

dex_users = [{
  email = "someone@inferencebros.com"
  password = "..."
  username = "someone"
}]
