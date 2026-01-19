resource "helm_release" "kmm" {
  name             = "kmm"
  repository       = "oci://ghcr.io/alinflorin/charts"
  chart            = "kmm"
  namespace        = "kubeai"
  create_namespace = false
  version          = "1.0.9"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      ingress:
        enabled: true
        className: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
        hosts:
          - host: kmm.${var.domain}
            paths:
              - path: /
                pathType: ImplementationSpecific
        tls:
          - secretName: kmm-tls
            hosts:
              - kmm.${var.domain}
      resources:
        requests:
          cpu: "30m"
          memory: "64Mi"
        limits:
          cpu: "50m"
          memory: "128Mi"
    EOT

  ]

  depends_on = [helm_release.kubeai]
}