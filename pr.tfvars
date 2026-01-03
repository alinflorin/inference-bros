servers = [
  {
    ip       = "192.168.1.174"
    port     = 22
    user     = "root"
    master   = true
    hostname = "k3s-master-1"
    iface    = "eth0"
  }
]
k3s_vip = "192.168.1.252"
metallb_range = "192.168.1.240-192.168.1.249"
domain  = "inferencebros.192.168.1.174.nip.io"

ssh_private_key = <<EOF
...
EOF

ssh_public_key = <<EOF
...
EOF


letsencrypt_email = "..."
location = "pr"
