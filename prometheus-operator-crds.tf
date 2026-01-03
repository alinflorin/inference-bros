resource "helm_release" "prometheus_operator_crds" {
  name       = "prometheus-operator-crds"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "prometheus-operator-crds"
  namespace  = "monitoring"
  create_namespace = true
  version = "25.0.1"
  atomic          = true
  wait            = true

  values = [
    <<-EOT

    EOT

  ]

  depends_on = [null_resource.k3s_installed]
}