resource "helm_release" "tempo" {
  name             = "tempo"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "tempo"
  namespace        = "monitoring"
  create_namespace = true
  version          = "1.24.3"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      persistence:
        enabled: true
        size: ${var.tempo_storage_gb}Gi
      tempo:
        metricsGenerator:
          enabled: true
          remoteWriteUrl: http://prometheus-operated:9090/api/v1/write
        multitenancyEnabled: false
    EOT
  ]

  depends_on = [helm_release.longhorn[0]]
}