resource "helm_release" "system_upgrade_controller" {
  name             = "system-upgrade-controller"
  repository       = "https://nimbolus.github.io/helm-charts"
  chart            = "system-upgrade-controller"
  namespace        = "kube-system"
  create_namespace = true
  version          = "0.7.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
    resources:
      limits:
        cpu: 10m
        memory: 90Mi
      requests:
        cpu: 5m
        memory: 30Mi
    EOT

  ]

  depends_on = [null_resource.k3s_installed]
}
