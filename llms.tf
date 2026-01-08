resource "helm_release" "llms_namespace" {
  name             = "llms"
  repository       = "https://ameijer.github.io/k8s-as-helm"
  chart            = "namespace"
  namespace        = "llms"
  create_namespace = true
  version          = "1.1.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      nameOverride: llms
    EOT

  ]

  depends_on = [null_resource.k3s_installed]
}