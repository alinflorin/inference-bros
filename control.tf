
module "openrouter_api" {
  source         = "./modules/generic-node-app"
  namespace = "control"
  name = "openrouter-api"
  location = var.location
  domain = var.domain
  ingress_enabled = true
  ingress_path = "/openrouter/models"
  ingress_subdomain = "control"
  enable_auth = false
  cpu_request = "50m"
  memory_request = "128Mi"
  cpu_limit = "100m"
  memory_limit = "256Mi"
  depends_on = [ helm_release.kubeai ]
}

module "invoicing" {
  source         = "./modules/generic-node-app"
  namespace = "control"
  name = "invoicing"
  location = var.location
  domain = var.domain
  ingress_enabled = true
  ingress_path = "/invoicing"
  ingress_subdomain = "control"
  enable_auth = true
  cpu_request = "50m"
  memory_request = "128Mi"
  cpu_limit = "100m"
  memory_limit = "256Mi"
  depends_on = [ helm_release.kubeai ]
}