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
      alertmanager:
        config:
          global:
            resolve_timeout: 5m
            slack_api_url: ${var.slack_webhook_url}
          inhibit_rules: []
          receivers:
          - name: "null"
          - name: slack-default
            slack_configs:
            - channel: '#grafana-alerts'
              send_resolved: true
          route:
            group_by:
            - cluster
            - alertname
            group_interval: 5m
            group_wait: 30s
            receiver: slack-default
            repeat_interval: 12h
            routes:
            - matchers:
              - alertname = "Watchdog"
              receiver: "null"
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