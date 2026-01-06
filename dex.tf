locals {
  dex_static_passwords = [
    for idx, u in var.dex_users : {
      email    = u.email
      username = u.username
      hash     = var.dex_passwords[idx]
      userID   = substr(sha1(u.username), 0, 8)
    }
  ]
}

resource "helm_release" "dex" {
  name             = "dex"
  repository       = "https://charts.dexidp.io"
  chart            = "dex"
  namespace        = "dex"
  create_namespace = true
  version          = "0.24.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      ingress:
        annotations:
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        className: nginx
        enabled: true
        hosts:
        - host: dex.${var.domain}
          paths:
          - path: /
            pathType: ImplementationSpecific
        tls:
        - hosts:
          - dex.${var.domain}
          secretName: dex-tls
      config:
        enablePasswordDB: true
        expiry:
          deviceRequests: 5m
          idTokens: 24h
          refreshTokens:
            absoluteLifetime: 3960h
            reuseInterval: 3s
            validIfNotUsedFor: 2160h
          signingKeys: 6h
        issuer: https://dex.${var.domain}
        oauth2:
          alwaysShowLoginScreen: false
          passwordConnector: local
          skipApprovalScreen: true
        staticClients:
        - id: k3s
          name: k3s
          public: true
          redirectURIs:
          - http://localhost:8000
          - http://localhost:18000
          - https://headlamp.${var.domain}/oidc-callback
          - https://kubenav.io/auth/oidc.html
        - id: oauth2-proxy
          name: oauth2-proxy
          public: false
          secret: "${random_string.oauth2_proxy_client_secret.result}"
          redirectURIs:
          - https://oauth2-proxy.${var.domain}/oauth2/callback
        - id: grafana
          name: grafana
          public: true
          redirectURIs:
          - https://grafana.${var.domain}/login/generic_oauth
        staticPasswords: []
        storage:
          type: memory
        web:
          http: 0.0.0.0:5556



    EOT
    ,
    yamlencode({
      config = {
        staticPasswords = local.dex_static_passwords
      }
    })
  ]

  depends_on = [helm_release.ingress_nginx, helm_release.cert_manager_issuer]
}
