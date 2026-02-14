resource "cloudflare_dns_record" "k3s" {
  zone_id = var.cloudflare_zone_id
  name    = "k3s.${var.location}"
  type    = "A"
  content = var.public_ip
  ttl     = 300
  proxied = false

  count = var.enable_dns == true && var.dns_type == "external-dns" ? 1 : 0
}

resource "cloudflare_dns_record" "wildcard_a" {
  zone_id = var.cloudflare_zone_id
  name    = "*.${var.location}"
  type    = "A"
  content = var.public_ip
  ttl     = 300
  proxied = false

  count = var.enable_dns == true && var.dns_type == "wildcard" && var.public_ip != "" && var.public_ip != null ? 1 : 0
}

resource "cloudflare_dns_record" "wildcard_cname" {
  zone_id = var.cloudflare_zone_id
  name    = "*.${var.location}"
  type    = "CNAME"
  content = var.public_hostname
  ttl     = 300
  proxied = false

  count = var.enable_dns == true && var.dns_type == "wildcard" && var.public_hostname != "" && var.public_hostname != null ? 1 : 0
}

resource "helm_release" "external_dns" {
  name             = "external-dns"
  repository       = "https://kubernetes-sigs.github.io/external-dns/"
  chart            = "external-dns"
  namespace        = "external-dns"
  create_namespace = true
  version          = "1.20.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resources:
        requests:
          cpu: 50m
          memory: 90Mi
        limits:
          
          memory: 128Mi
      serviceMonitor:
        enabled: true
      provider: cloudflare
      txtOwnerId: ${var.location}
      txtPrefix: ${var.location}
      policy: sync
      domainFilters:
        - "${var.location}.${var.domain}"
      env:
        - name: CF_API_TOKEN
          value: "${var.cloudflare_api_token}"
    EOT

  ]

  count = var.enable_dns == true && var.dns_type == "external-dns" ? 1 : 0

  depends_on = [helm_release.prometheus_operator_crds]
}
