variable "ssh_private_key" {
  type      = string
  sensitive = true
}

variable "ssh_public_key" {
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
    iface    = string
  }))
}