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
k3s_vip         = "192.168.0.252"
metallb_range   = "192.168.0.240-192.168.0.249"
nginx_metallb_ip = "192.168.0.240"
domain          = "stalpeni.inferencebros.com"
root_ca_crt = <<EOF
#{ROOT_CA_CRT}
EOF
root_ca_key = <<EOF
#{ROOT_CA_KEY}
EOF
ssh_private_key = <<EOF
#{SSH_PRIVATE_KEY}
EOF

ssh_public_key = <<EOF
#{SSH_PUBLIC_KEY}
EOF

letsencrypt_email = "#{LETSENCRYPT_EMAIL}"
location          = "stalpeni"

dex_users = [
  {
    email    = "#{ALIN_EMAIL}"
    username = "alin"
  },
  {
    email    = "#{TEODOR_EMAIL}"
    username = "teodor"
  },
  {
    email    = "#{SORIN_EMAIL}"
    username = "sorin"
  }
]

dex_passwords = [ 
  "#{ALIN_PASSWORD}",
  "#{TEODOR_PASSWORD}",
  "#{SORIN_PASSWORD}"
]

enable_longhorn = false