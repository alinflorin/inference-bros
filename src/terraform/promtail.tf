resource "helm_release" "promtail" {
  name             = "promtail"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "promtail"
  namespace        = "monitoring"
  create_namespace = true
  version          = "6.17.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      config:
        clients:
        - url: http://loki:3100/loki/api/v1/push
      resources:
        limits:
          cpu: 100m
          memory: 128Mi
        requests:
          cpu: 100m
          memory: 128Mi
    EOT
  ]
  count      = var.monitoring_enabled ? 1 : 0
  depends_on = [helm_release.loki[0]]
}
