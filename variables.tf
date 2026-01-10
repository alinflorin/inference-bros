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
    ip       = string
    hostname = string
    port     = number
    user     = string
    master   = bool
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