variable "domain" {
  type = string
}

variable "location" {
  type = string
}


variable "name" {
  type = string
}

variable "namespace" {
  type = string
}

variable "ingress_enabled" {
    type = bool
    default = false
}

variable "enable_auth" {
    type = bool
    default = false
}

variable "replicas" {
    type = number
    default = 1
}

variable "service_enabled" {
  type = bool
  default = true
}