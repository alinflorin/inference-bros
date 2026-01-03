terraform {
  required_version = ">= 1.14.3"

  required_providers {
    ssh = {
      source = "loafoe/ssh"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
    helm = {
      source = "hashicorp/helm"
    }
    null = {
      source = "hashicorp/null"
    }
  }
}
