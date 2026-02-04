terraform {
  backend "local" {}
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
    random = {
      source = "hashicorp/random"
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
    minio = {
      source = "aminueza/minio"
    }
  }
}
