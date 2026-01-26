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
          memory: 128Mi
        limits:
          cpu: 100m
          memory: 256Mi
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

  count = var.enable_dns ? 1 : 0

  depends_on = [helm_release.prometheus_operator_crds]
}