resource "helm_release" "headlamp" {
  name             = "headlamp"
  repository       = "https://kubernetes-sigs.github.io/headlamp/"
  chart            = "headlamp"
  namespace        = "headlamp"
  create_namespace = true
  version          = "0.40.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      config:
        baseURL: ""
        enableHelm: true
        extraArgs:
        ${var.location == "local" ? "- --oidc-skip-tls-verify" : ""}
        inCluster: true
        oidc:
          callbackURL: ""
          clientID: k3s
          clientSecret: ""
          externalSecret:
            enabled: false
            name: ""
          issuerURL: https://dex.${var.domain}
          meUserInfoURL: ""
          scopes: openid profile email offline_access
          secret:
            create: true
            name: oidc
          useAccessToken: false
          usePKCE: true
          validatorClientID: ""
          validatorIssuerURL: ""
        pluginsDir: /headlamp/plugins
        watchPlugins: true
      ingress:
        annotations:
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        enabled: true
        hosts:
        - host: headlamp.${var.domain}
          paths:
          - path: /
            type: ImplementationSpecific
        ingressClassName: nginx
        labels: {}
        tls:
        - hosts:
          - headlamp.${var.domain}
          secretName: headlamp-tls
      pluginsManager:
        baseImage: node:lts-alpine
        configContent: |
          plugins: []
        configFile: plugin.yml
        enabled: false
        securityContext: {}
        version: latest
      resources:
        requests:
          cpu: 100m
          memory: 30Mi
        limits:
          
          memory: 128Mi
    EOT

  ]

  depends_on = [null_resource.k3s_installed, helm_release.ingress_nginx]
  count      = var.monitoring_enabled ? 1 : 0
}
