resource "helm_release" "nvidia_gpu_operator" {
  name             = "nvidia-gpu-operator"
  repository       = "https://helm.ngc.nvidia.com/nvidia"
  chart            = "gpu-operator"
  namespace        = "gpu-operator"
  create_namespace = true
  version          = "v25.10.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      driver:
        enabled: false
      toolkit:
        enabled: true
        env:
          - name: CONTAINERD_CONFIG
            value: /var/lib/rancher/k3s/agent/etc/containerd/config.toml
          - name: CONTAINERD_SOCKET
            value: /run/k3s/containerd/containerd.sock
          - name: CONTAINERD_RUNTIME_CLASS
            value: nvidia
          - name: CONTAINERD_SET_AS_DEFAULT
            value: "true"
    EOT

  ]

  count = var.kubeai_compute_processor == "nvidia" ? 1 : 0

  depends_on = [null_resource.k3s_installed]
}

resource "helm_release" "amd_gpu_operator" {
  name             = "amd-gpu-operator"
  repository       = "https://rocm.github.io/gpu-operator"
  chart            = "gpu-operator-charts"
  namespace        = "kube-amd-gpu"
  create_namespace = true
  version          = "v1.4.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT

    EOT

  ]

  count = var.kubeai_compute_processor == "amd" ? 1 : 0

  depends_on = [helm_release.cert_manager]
}
