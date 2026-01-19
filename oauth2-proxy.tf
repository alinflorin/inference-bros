resource "random_string" "oauth2_proxy_cookie_secret" {
  length  = 32
  special = false
  upper   = false
}

resource "random_string" "oauth2_proxy_client_secret" {
  length  = 32
  special = false
  upper   = false
}

resource "helm_release" "oauth2_proxy" {
  name             = "oauth2-proxy"
  repository       = "https://oauth2-proxy.github.io/manifests"
  chart            = "oauth2-proxy"
  namespace        = "oauth2-proxy"
  create_namespace = true
  version          = "8.5.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      extraArgs:
        - --cookie-secure=false
        - --skip-provider-button
        - --reverse-proxy
        ${var.location == "local" ? "- --ssl-insecure-skip-verify" : ""}
      ingress:
        annotations:
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        className: nginx
        enabled: true
        hosts:
        - oauth2-proxy.${var.domain}
        labels: {}
        path: /
        pathType: ImplementationSpecific
        tls:
        - hosts:
            - oauth2-proxy.${var.domain}
          secretName: oauth2-proxy-tls
      config:
        clientID: oauth2-proxy
        clientSecret: "${random_string.oauth2_proxy_client_secret.result}"
        configFile: |-
          email_domains = [ "*" ]
          upstreams = [ "static://200" ]
          provider = "oidc"
          cookie_secure = false
          redirect_url = "https://oauth2-proxy.${var.domain}/oauth2/callback"
          scope = "openid email profile offline_access"
          cookie_domains = ".${var.domain}"
          cookie_name = "_oauth2_proxy"
          cookie_refresh = "2m"
          cookie_expire = "24h"
          whitelist_domains = [".${var.domain}"]
          set_xauthrequest = true
          client_id = "oauth2-proxy"
          client_secret = "${random_string.oauth2_proxy_client_secret.result}"
          oidc_issuer_url = "https://dex.${var.domain}"
          ssl_insecure_skip_verify = ${var.location == "local" ? "true" : "false"}
          code_challenge_method = "S256"
        cookieName: ""
        cookieSecret: ${random_string.oauth2_proxy_cookie_secret.result}
      resources:
        limits:
          cpu: 100m
          memory: 128Mi
        requests:
          cpu: 50m
          memory: 64Mi
    EOT

  ]

  depends_on = [helm_release.dex]
}