resource "helm_release" "kmm" {
  name             = "kmm"
  repository       = "oci://ghcr.io/alinflorin/charts"
  chart            = "kmm"
  namespace        = "kubeai"
  create_namespace = false
  version          = "1.1.0"
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
          nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
          nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
          nginx.ingress.kubernetes.io/proxy-buffering: "off"
          nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
          nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
        hosts:
          - host: kmm.${var.domain}
            paths:
              - path: /
                pathType: Prefix
        tls:
          - secretName: kmm-tls
            hosts:
              - kmm.${var.domain}
      publicIngress:
        enabled: true
        className: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
        hosts:
          - host: kmm.${var.domain}
            paths:
              - path: /public
                pathType: Prefix
        tls:
          - secretName: kmm-tls
            hosts:
              - kmm.${var.domain}
      resources:
        requests:
          cpu: "50m"
          memory: "128Mi"
        limits:
          cpu: "200m"
          memory: "256Mi"
    EOT

  ]

  depends_on = [helm_release.kubeai]
}