variable "ssh_private_key" {
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  type        = string
  sensitive   = true
}

variable "root_ca_key" {
  type        = string
  sensitive   = true
}

variable "root_ca_crt" {
  type        = string
  sensitive   = true
}

variable "servers" {
  type = list(object({
    ip     = string
    port   = number
    user   = string
    master = bool
    iface = string
  }))
}