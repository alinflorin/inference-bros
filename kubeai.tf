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
      replicaCount: ${var.kubeai_proxy_replicas}
      resourceProfiles:
        nvidia:
          limits:
            nvidia.com/gpu: "1"
          requests:
            nvidia.com/gpu: "1"
        amd:
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
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
    EOT

  ]

  depends_on = [helm_release.grafana, helm_release.amd_gpu_operator, helm_release.nvidia_gpu_operator]
}