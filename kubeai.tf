locals {
  nvidia_kubeai_values = <<-EOT
    resourceProfiles:
      nvidia-gpu-a16:
        nodeSelector:
          nvidia.com/gpu.family: "ampere"
          nvidia.com/gpu.memory: "16384"
      nvidia-gpu-l4:
        nodeSelector:
          nvidia.com/gpu.family: "ada-lovelace"
          nvidia.com/gpu.memory: "23034"
      nvidia-gpu-h100:
        nodeSelector:
          nvidia.com/gpu.family: "hopper"
          nvidia.com/gpu.memory: "81920"
      nvidia-gpu-gh200:
        nodeSelector:
          nvidia.com/gpu.family: "hopper"
          nvidia.com/gpu.memory: "97871"
      nvidia-gpu-a100-80gb:
        nodeSelector:
          nvidia.com/gpu.family: "ampere"
          nvidia.com/gpu.memory: "81920"
      nvidia-gpu-a100-40gb:
        nodeSelector:
          nvidia.com/gpu.family: "ampere"
          nvidia.com/gpu.memory: "40960"
      nvidia-gpu-rtx4070-8gb:
        nodeSelector:
          nvidia.com/gpu.family: "ampere"
          nvidia.com/gpu.memory: "8188"
      nvidia-gpu-rtx4090-24gb:
        nodeSelector:
          nvidia.com/gpu.family: "ampere"
          nvidia.com/gpu.memory: "24564"
  EOT

  amd_kubeai_values = <<-EOT
    resourceProfiles:
      amd-gpu-mi300x:
        nodeSelector:
          # Source: https://gitlab.freedesktop.org/mesa/drm/-/blob/main/data/amdgpu.ids#L569
          amd.com/gpu.device-id: 74a1
          amd.com/gpu.vram: "192G"
          amd.com/gpu.family: "AI"
  EOT

}
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
      secrets:
        huggingface:
          token: ${var.huggingface_token}
      metrics:
        prometheusOperator:
          vLLMPodMonitor:
            enabled: true
            labels: {}
    EOT
    ,
    var.kubeai_compute_processor == "nvidia" ? local.nvidia_kubeai_values : ""

  ]

  depends_on = [helm_release.grafana, helm_release.amd_gpu_operator, helm_release.nvidia_gpu_operator]
}