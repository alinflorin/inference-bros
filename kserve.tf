resource "helm_release" "kserve_crd" {
  name             = "kserve-crd"
  repository       = "oci://ghcr.io/kserve/charts"
  chart            = "kserve-crd"
  namespace        = "kserve"
  create_namespace = true
  version          = "v0.16.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT

    EOT

  ]

  depends_on = [helm_release.grafana]
}

resource "helm_release" "kserve" {
  name             = "kserve"
  repository       = "oci://ghcr.io/kserve/charts"
  chart            = "kserve"
  namespace        = "kserve"
  create_namespace = true
  version          = "v0.16.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      kserve:
        controller:
          deploymentMode: RawDeployment
          gateway:
            domain: "kserve.${var.domain}"
            ingressGateway:
              className: "nginx"
        metricsaggregator:
          enableMetricAggregation: "true"
          enablePrometheusScraping: "true"
    EOT

  ]

  depends_on = [helm_release.kserve_crd]
}