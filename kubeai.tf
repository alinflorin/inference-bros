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
        cpu:
          imageName: "cpu"
          requests:
            cpu: "0"
            memory: "0"
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