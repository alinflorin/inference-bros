resource "helm_release" "fluent-bit" {
  name             = "fluent-bit"
  repository       = "https://fluent.github.io/helm-charts"
  chart            = "fluent-bit"
  namespace        = "monitoring"
  create_namespace = true
  version          = "0.55.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resources:
        limits:
          cpu: null
          memory: 128Mi
        requests:
          cpu: 50m
          memory: 20Mi

      config:
        outputs: |
          [OUTPUT]
              Name                   loki
              Match                  *
              Host                   loki
              Port                   3100
              Labels                 job=fluentbit
              Auto_Kubernetes_Labels on
    EOT
  ]
  count      = var.monitoring_enabled ? 1 : 0
  depends_on = [helm_release.loki[0]]
}
