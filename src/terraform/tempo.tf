resource "helm_release" "tempo" {
  name             = "tempo"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "tempo"
  namespace        = "monitoring"
  create_namespace = true
  version          = "1.26.3"
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
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 1Gi
    EOT
  ]

  count = var.monitoring_enabled ? 1 : 0

  depends_on = [helm_release.longhorn[0]]
}
