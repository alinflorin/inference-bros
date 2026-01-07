resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  namespace  = "monitoring"
  create_namespace = true
  version = "10.5.3"
  atomic          = true
  wait            = true

  values = [
    <<-EOT
assertNoLeakedSecrets: false
grafana.ini:
  analytics:
    check_for_updates: false
  server:
    root_url: https://grafana.${var.domain}
ingress:
  annotations:
    cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  enabled: true
  hosts:
    - grafana.${var.domain}
  ingressClassName: nginx
  tls:
    - hosts:
        - grafana.${var.domain}
      secretName: grafana-tls
persistence:
  enabled: true
  size: ${var.grafana_storage_gb}Gi
    EOT
  ]

  depends_on = [helm_release.loki, helm_release.promtail, helm_release.kube_prometheus_stack]
}