variable "ssh_private_key" {
  type        = string
  sensitive   = true
}

variable "servers" {
  type = list(object({
    ip     = string
    port   = number
    user   = string
    master = bool
  }))
}