module "generic_app" {
  source         = "./modules/generic-node-app"
  namespace = "generic"
  name = "generic"
  location = var.location
  domain = var.domain
  ingress_enabled = false
  enable_auth = false

  depends_on = [ helm_release.longhorn[0] ]
}