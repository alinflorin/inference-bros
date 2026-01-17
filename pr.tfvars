servers = [
  {
    ip       = "192.168.0.101"
    port     = 22
    user     = "root"
    master   = true
    hostname = "k3s-master-1"
  }
]
k3s_vip          = "192.168.0.252"
metallb_range    = "192.168.0.240-192.168.0.249"
nginx_metallb_ip = "192.168.0.240"
domain           = "pr.inferencebros.com"
root_ca_crt      = <<EOF
...
EOF
root_ca_key      = <<EOF
...
EOF
ssh_private_key  = <<EOF
...
EOF

ssh_public_key = <<EOF
...
EOF


letsencrypt_email = "..."
location          = "pr"

dex_users = [{
  email    = "someone@inferencebros.com"
  username = "someone"
}]

dex_passwords = ["..."]

prometheus_storage_gb = 10
loki_storage_gb       = 5
grafana_storage_gb    = 5

slack_webhook_url        = "..."
huggingface_token        = "..."
kubeai_compute_processor = "cpu"
longhorn_replica_count   = 1
longhorn_enabled         = false