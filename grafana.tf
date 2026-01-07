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
      useStatefulSet: true
      dashboardProviders:
        dashboardproviders.yaml:
          apiVersion: 1
          providers:
            - name: "default"
              orgId: 1
              folder: ""
              type: file
              disableDeletion: true
              editable: false
              options:
                path: /var/lib/grafana/dashboards/default
      dashboards:
        default:
          node-exporter:
            gnetId: 1860
            datasource: Prometheus
            revision: 42
          cert-manager:
            gnetId: 22184
            datasource: Prometheus
            revision: 3
          logs-app:
            gnetId: 13639
            datasource: Loki
            revision: 2
          ingress-nginx:
            gnetId: 14314
            datasource: Prometheus
            revision: 2
          longhorn:
            gnetId: 16888
            datasource: Prometheus
            revision: 11
          k3s:
            gnetId: 16450
            datasource: Prometheus
            revision: 3
      datasources:
        datasources.yaml:
          apiVersion: 1
          datasources:
            - name: Prometheus
              type: prometheus
              access: proxy
              url: http://prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090
              isDefault: true
              editable: false
            - name: Loki
              type: loki
              access: proxy
              url: http://loki.monitoring.svc.cluster.local:3100
              editable: false
      assertNoLeakedSecrets: false
      grafana.ini:
        auth:
          disable_login_form: true
        auth.generic_oauth:
          enabled: true
          auto_login: true
          role_attribute_path: false || 'GrafanaAdmin'
          allow_assign_grafana_admin: true
          scopes: 'openid profile email offline_access'
          client_id: grafana
          allow_sign_up: true
          name: Dex
          auth_url: https://dex.${var.domain}/auth
          token_url: https://dex.${var.domain}/token
          api_url: https://dex.${var.domain}/userinfo
          use_pkce: true
          use_refresh_token: true
          ${var.location == "local" ? "tls_skip_verify_insecure: true" : ""}
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