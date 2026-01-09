resource "helm_release" "headlamp" {
  name             = "headlamp"
  repository       = "https://kubernetes-sigs.github.io/headlamp/"
  chart            = "headlamp"
  namespace        = "headlamp"
  create_namespace = true
  version          = "0.39.0"
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
          plugins:
            - name: cert-manager
              source: https://artifacthub.io/packages/headlamp/headlamp-plugins/headlamp_cert-manager
              version: 0.1.0
            - name: kompose
              source: https://artifacthub.io/packages/headlamp/headlamp-plugins/headlamp_kompose
              version: 0.1.0-beta-1
        configFile: plugin.yml
        enabled: true
        securityContext: {}
        version: latest
    EOT

  ]

  depends_on = [helm_release.cluster_admins]
}