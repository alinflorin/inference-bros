servers = [
  {
    ip                 = "192.168.1.101"
    ssh_ip_or_hostname = "inferencebros-stalpeni.go.ro"
    port               = 2201
    user               = "root"
    master             = true
    hostname           = "k3s-master-1"
  }
]
k3s_vip          = "192.168.1.252"
metallb_range    = "192.168.1.240-192.168.1.249"
nginx_metallb_ip = "192.168.1.240"
domain           = "stalpeni.inferencebros.com"
root_ca_crt      = <<EOF
#{ROOT_CA_CRT}
EOF
root_ca_key      = <<EOF
#{ROOT_CA_KEY}
EOF
ssh_private_key  = <<EOF
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

kubeai_hpa = {
  cpu_utilization    = 80
  memory_utilization = 80
  enabled            = false
  min_replicas       = 1
  max_replicas       = 2
}

bifrost_hpa = {
  cpu_utilization    = 80
  memory_utilization = 80
  enabled            = false
  min_replicas       = 1
  max_replicas       = 2
}

nginx_hpa = {
  cpu_utilization    = 80
  memory_utilization = 80
  enabled            = false
  min_replicas       = 1
  max_replicas       = 2
}

prometheus_storage_gb   = 10
loki_storage_gb         = 10
grafana_storage_gb      = 10
tempo_storage_gb        = 10
mail_storage_gb         = 1
bifrost_storage_gb      = 100
alertmanager_storage_gb = 5
kubeai_pvc_storage_gb   = 100

smtp_username       = "#{SMTP_USERNAME}"
smtp_password       = "#{SMTP_PASSWORD}"
smtp_host           = "#{SMTP_HOST}"
smtp_allowed_domain = "inferencebros.com"

slack_webhook_url        = "#{SLACK_WEBHOOK_URL}"
huggingface_token        = "#{HF_TOKEN}"
kubeai_compute_processor = "nvidia"
longhorn_replica_count   = 1
longhorn_enabled         = true

nginx_replicas        = 1
kubeai_proxy_replicas = 1
bifrost_replicas      = 1

bifrost_insecure_enable = false
monitoring_enabled      = true
odoo_api_key            = "#{ODOO_API_KEY}"
odoo_url                = "https://inferencebros.odoo.com"
odoo_database           = "inferencebros"
odoo_tax_id             = 129

enable_dns           = true
cloudflare_api_token = "#{CLOUDFLARE_API_TOKEN}"
cloudflare_zone_id   = "#{CLOUDFLARE_ZONE_ID}"
public_ip            = null
public_hostname      = "inferencebros-stalpeni.go.ro"
dns_type             = "wildcard"
