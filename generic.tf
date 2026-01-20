module "generic_app" {
  source         = "./modules/generic-node-app"
  namespace = "generic"
  name = "generic"
  location = var.location
  domain = var.domain
  ingress_enabled = true
  enable_auth = true
  cpu_request = "50m"
  memory_request = "128Mi"
  cpu_limit = "100m"
  memory_limit = "256Mi"
  depends_on = [ helm_release.longhorn[0] ]
}