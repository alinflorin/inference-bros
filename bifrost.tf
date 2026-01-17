resource "helm_release" "bifrost" {
  name             = "bifrost"
  repository       = "https://maximhq.github.io/bifrost/helm-charts"
  chart            = "bifrost"
  namespace        = "bifrost"
  create_namespace = true
  atomic           = true
  wait             = true
  version = "1.5.2"

  values = [
    <<-EOT
      image:
        tag: 'v1.3.63'
      replicaCount: 1
      storage:
        mode: sqlite
        persistence:
          size: 5Gi
      ingress:
        enabled: true
        className: nginx
        annotations:
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
        hosts:
          - host: bifrost.${var.domain}
            paths:
              - path: /
                pathType: Prefix
        tls:
          - secretName: bifrost-tls
            hosts:
              - bifrost.${var.domain}

    EOT

  ]

  depends_on = [helm_release.kmm]
}