resource "helm_release" "kube_prometheus_stack" {
  name             = "prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = "monitoring"
  create_namespace = true
  version          = "80.13.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      crds:
        enabled: false
      grafana:
        enabled: false
      prometheus:
        prometheusSpec:
          serviceMonitorSelectorNilUsesHelmValues: false
          podMonitorSelectorNilUsesHelmValues: false
          namespaceMonitorSelectorNilUsesHelmValues: false
          ruleSelectorNilUsesHelmValues: false
          retention: 3d
          storageSpec:
            volumeClaimTemplate:
              spec:
                accessModes: ["ReadWriteOnce"]
                resources:
                  requests:
                    storage: ${var.prometheus_storage_gb}Gi
    EOT

  ]

  depends_on = [helm_release.longhorn]
}