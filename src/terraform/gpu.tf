resource "helm_release" "nvidia_gpu_time_slicing" {
  name             = "nvidia-gpu-time-slicing"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "gpu-operator"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: time-slicing-config-all
          namespace: gpu-operator
        data:
          any: |-
            version: v1
            flags:
              migStrategy: none
            sharing:
              timeSlicing:
                resources:
                - name: nvidia.com/gpu
                  replicas: ${var.nvidia_timeslicing_replicas}

    EOT

  ]
  count = var.kubeai_compute_processor == "nvidia" ? 1 : 0

  depends_on = [helm_release.cert_manager]
}

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
      devicePlugin:
        config:
          name: time-slicing-config-all
          default: any
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

  depends_on = [helm_release.nvidia_gpu_time_slicing[0]]
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
