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
tempo_storage_gb      = 5
mail_storage_gb       = 1
bifrost_storage_gb    = 50
alertmanager_storage_gb = 1

smtp_username       = "..."
smtp_password       = "..."
smtp_host           = "..."
smtp_allowed_domain = "inferencebros.com"

slack_webhook_url        = "..."
huggingface_token        = "..."
kubeai_compute_processor = "cpu"
longhorn_replica_count   = 3
longhorn_enabled         = false

nginx_replicas        = 5
kubeai_proxy_replicas = 5
bifrost_replicas      = 5

bifrost_insecure_enable = false
monitoring_enabled     = true