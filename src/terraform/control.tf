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
  depends_on        = [helm_release.bifrost]
  env = {
    "ODOO_URL"      = var.odoo_url,
    "ODOO_API_KEY"  = var.odoo_api_key
    "ODOO_DATABASE" = var.odoo_database
    "ODOO_TAX_ID"   = tostring(var.odoo_tax_id)
  }
}


resource "helm_release" "control_public_ingress" {
  name             = "control-public-ingress"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "control"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: networking.k8s.io/v1
        kind: Ingress
        metadata:
          name: control-public
          namespace: control
          labels:
            app.kubernetes.io/instance: control
            app.kubernetes.io/name: control
          annotations:
            cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
            nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        spec:
          ingressClassName: nginx

          tls:
            - hosts:
                - control.${var.domain}
              secretName: control-tls

          rules:
            - host: control.${var.domain}
              http:
                paths:
                  - path: /usage
                    pathType: Prefix
                    backend:
                      service:
                        name: control
                        port:
                          number: 80

    EOT

  ]

  depends_on = [module.control, helm_release.ingress_nginx]
}
