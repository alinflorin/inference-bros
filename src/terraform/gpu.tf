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
      node-feature-discovery:
        gc:
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 300m
              memory: 128Mi
        master:
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 300m
              memory: 128Mi
        worker:
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 300m
              memory: 128Mi
      gfd:
        resources:
          requests:
            cpu: 50m
            memory: 128Mi
          limits:
            cpu: 700m
            memory: 256Mi
      operator:
        resources:
          requests:
            cpu: 50m
            memory: 30Mi
          limits:
            cpu: 300m
            memory: 90Mi
      validator:
        resources:
          requests:
            cpu: 50m
            memory: 10Mi
          limits:
            cpu: 300m
            memory: 50Mi
      dcgmExporter:
        resources:
          requests:
            cpu: 50m
            memory: 450Mi
          limits:
            cpu: 300m
            memory: 512Mi
      driver:
        enabled: false
      devicePlugin:
        resources:
          requests:
            cpu: 50m
            memory: 30Mi
          limits:
            cpu: 300m
            memory: 90Mi
      toolkit:
        enabled: true
        resources:
          requests:
            cpu: 50m
            memory: 10Mi
          limits:
            cpu: 300m
            memory: 50Mi
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

  depends_on = [helm_release.cert_manager]
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
      kmm:
        enabled: false
      dp:
        resources:
          requests:
            cpu: 50m
            memory: 30Mi
          limits:
            cpu: 300m
            memory: 90Mi
      lbl:
        resources:
          requests:
            cpu: 50m
            memory: 30Mi
          limits:
            cpu: 300m
            memory: 90Mi
    EOT

  ]

  count = var.kubeai_compute_processor == "amd" ? 1 : 0

  depends_on = [helm_release.cert_manager]
}
