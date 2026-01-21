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

variable "memory_request" {
  type = string
  default = ""
}

variable "cpu_request" {
  type = string
  default = ""
}

variable "memory_limit" {
  type = string
  default = ""
}

variable "cpu_limit" {
  type = string
  default = ""
}

variable "ingress_subdomain" {
  type = string
  default = ""
}

variable "ingress_path" {
  type = string
  default = "/"
}

variable "termination_grace_period_seconds" {
  type = number
  default = 10
}

variable "env" {
  type = map(string)
  default = {}
}