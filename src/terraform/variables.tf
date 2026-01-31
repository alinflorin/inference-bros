variable "ssh_private_key" {
  type      = string
  sensitive = true
}

variable "ssh_public_key" {
  type      = string
  sensitive = true
}

variable "root_ca_key" {
  type      = string
  sensitive = true
}

variable "root_ca_crt" {
  type      = string
  sensitive = true
}

variable "letsencrypt_email" {
  type      = string
  sensitive = true
}

variable "k3s_vip" {
  type = string
}

variable "domain" {
  type = string
}

variable "servers" {
  type = list(object({
    ip                 = string
    ssh_ip_or_hostname = string
    hostname           = string
    port               = number
    user               = string
    master             = bool
  }))
}

variable "location" {
  type = string
}

variable "metallb_range" {
  type = string
}

variable "nginx_metallb_ip" {
  type = string
}

variable "dex_users" {
  type = list(object({
    email    = string
    username = string
  }))
}

variable "dex_passwords" {
  type      = list(string)
  sensitive = true
}

variable "prometheus_storage_gb" {
  type = number
}

variable "loki_storage_gb" {
  type = number
}

variable "grafana_storage_gb" {
  type = number
}

variable "tempo_storage_gb" {
  type = number
}

variable "mail_storage_gb" {
  type = number
}

variable "bifrost_storage_gb" {
  type = number
}

variable "alertmanager_storage_gb" {
  type = number
}

variable "kubeai_pvc_storage_gb" {
  type = number
}

variable "smtp_allowed_domain" {
  type = string
}

variable "smtp_host" {
  type      = string
  sensitive = true
}

variable "smtp_username" {
  type      = string
  sensitive = true
}

variable "smtp_password" {
  type      = string
  sensitive = true
}

variable "slack_webhook_url" {
  type      = string
  sensitive = true
}

variable "huggingface_token" {
  type      = string
  sensitive = true
}

variable "kubeai_compute_processor" {
  type = string
}

variable "longhorn_replica_count" {
  type = number
}

variable "longhorn_enabled" {
  type = bool
}

variable "bifrost_replicas" {
  type = number
}

variable "kubeai_proxy_replicas" {
  type = number
}

variable "nginx_replicas" {
  type = number
}

variable "bifrost_insecure_enable" {
  type = bool
}

variable "monitoring_enabled" {
  type = bool
}

variable "odoo_api_key" {
  type      = string
  sensitive = true
}

variable "odoo_url" {
  type = string
}

variable "odoo_database" {
  type = string
}

variable "odoo_tax_id" {
  type = number
}

variable "kubeai_hpa" {
  type = object({
    enabled            = bool
    min_replicas       = number
    max_replicas       = number
    cpu_utilization    = number
    memory_utilization = number
  })
}

variable "bifrost_hpa" {
  type = object({
    enabled            = bool
    min_replicas       = number
    max_replicas       = number
    cpu_utilization    = number
    memory_utilization = number
  })
}

variable "nginx_hpa" {
  type = object({
    enabled            = bool
    min_replicas       = number
    max_replicas       = number
    cpu_utilization    = number
    memory_utilization = number
  })
}

variable "enable_dns" {
  type = bool
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type      = string
  sensitive = true
}


variable "public_ip" {
  type     = string
  nullable = true
}

variable "public_hostname" {
  type     = string
  nullable = true
}

variable "dns_type" {
  type = string
}
