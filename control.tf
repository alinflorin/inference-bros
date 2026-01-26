module "control" {
  source            = "./modules/generic-node-app"
  namespace         = "control"
  name              = "control"
  location          = var.location
  domain            = var.domain
  ingress_enabled   = true
  ingress_path      = "/"
  ingress_subdomain = "control"
  enable_auth       = true
  cpu_request       = "50m"
  memory_request    = "128Mi"
  cpu_limit         = "100m"
  memory_limit      = "256Mi"
  depends_on        = [null_resource.k3s_installed]
  env = {
    "ODOO_URL"      = var.odoo_url,
    "ODOO_API_KEY"  = var.odoo_api_key
    "ODOO_DATABASE" = var.odoo_database
    "ODOO_TAX_ID"   = tostring(var.odoo_tax_id)
  }
}