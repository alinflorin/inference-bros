resource "helm_release" "kserve_crd" {
  name             = "kserve-crd"
  repository       = "oci://ghcr.io/kserve/charts"
  chart            = "kserve-crd"
  namespace        = "kserve"
  create_namespace = true
  version          = "v0.15.0"
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
  version          = "v0.15.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      kserve:
        controller:
          deploymentMode: Standard
          gateway:
            domain: "kserve.${var.domain}"
            disableIstioVirtualHost: true
            ingressGateway:
              className: "nginx"
          resources:
            limits:
              cpu: ''
              memory: ''
            requests:
              cpu: ''
              memory: ''
          rbacProxy:
            resources:
              limits:
                cpu: ''
                memory: ''
              requests:
                cpu: '
                memory: ''
        storage:
          resources:
            requests:
              memory: ''
              cpu: ''
            limits:
              memory: ''
              cpu: ''
        metricsaggregator:
          enableMetricAggregation: "true"
          enablePrometheusScraping: "true"
    EOT

  ]

  depends_on = [helm_release.kserve_crd]
}