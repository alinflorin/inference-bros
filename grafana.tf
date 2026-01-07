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
        users:
          auto_assign_org_role: GrafanaAdmin
        auth:
          disable_login_form: true
          auto_assign_org_role: GrafanaAdmin
        auth.basic:
          enabled: false
        auth.generic_oauth:
          auto_assign_org_role: GrafanaAdmin
          enabled: true
          auto_login: true
          role_attribute_path: "'GrafanaAdmin'"
          role_attribute_strict: false
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