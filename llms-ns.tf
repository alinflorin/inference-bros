resource "helm_release" "llms_ns" {
  name             = "llms-ns"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "default"
  create_namespace = false
  version          = "0.1.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: v1
        kind: Namespace
        metadata:
          name: llms
    EOT

  ]

  depends_on = [null_resource.k3s_installed]
}