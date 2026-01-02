terraform {
  required_version = ">= 1.14.3"

  backend "local" {
    path = "terraform.tfstate"
  }

  required_providers {

  }
}
