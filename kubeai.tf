resource "helm_release" "kubeai" {
  name             = "kubeai"
  repository       = "https://www.kubeai.org"
  chart            = "kubeai"
  namespace        = "kubeai"
  create_namespace = true
  version          = "0.23.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resourceProfiles:
        nvidia-bagabonti:
          limits:
            nvidia.com/gpu: "1"
          requests:
            nvidia.com/gpu: "1"
        amd-bagabonti:
          limits:
            amd.com/gpu: "1"
          requests:
            amd.com/gpu: "1"
      secrets:
        huggingface:
          token: ${var.huggingface_token}
      metrics:
        prometheusOperator:
          vLLMPodMonitor:
            enabled: true
            labels: {}
      open-webui:
        enabled: false
      ingress:
        enabled: true
        className: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}

        rules:
          - host: kubeai.${var.domain}
            paths:
              - path: /
                pathType: ImplementationSpecific
        tls:
          - secretName: kubeai-tls
            hosts:
              - kubeai.${var.domain}
    EOT

  ]

  depends_on = [helm_release.grafana, helm_release.amd_gpu_operator, helm_release.nvidia_gpu_operator]
}

resource "helm_release" "kmm" {
  name             = "kmm"
  repository       = "oci://ghcr.io/alinflorin/charts"
  chart            = "kmm"
  namespace        = "kubeai"
  create_namespace = false
  version          = "1.0.8"
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
    EOT

  ]

  depends_on = [helm_release.kubeai]
}