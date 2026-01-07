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

    EOT

  ]

  depends_on = [null_resource.k3s_installed]
}