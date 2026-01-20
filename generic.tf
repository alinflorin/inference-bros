module "generic_app" {
  source         = "./modules/generic-node-app"
  namespace = "generic"
  name = "generic"
  location = var.location
  domain = var.domain
  ingress_enabled = true
  enable_auth = true

  depends_on = [ helm_release.longhorn[0] ]
}