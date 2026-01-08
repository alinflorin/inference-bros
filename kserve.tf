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
        storage:
          resources:
            requests:
              memory: "0"
              cpu: "0"
            limits:
              memory: "0"
              cpu: "0"
          cpuModelcar: "0"
          memoryModelcar: "0"
        controller:
          deploymentMode: RawDeployment
          resources:
            limits:
              cpu: "0"
              memory: "0"
            requests:
              cpu: "0"
              memory: "0"
          rbacProxy:
            resources:
              limits:
                cpu: "0"
                memory: "0"
              requests:
                cpu: "0"
                memory: "0"
          gateway:
            domain: "kserve.${var.domain}"
            ingressGateway:
              className: "nginx"
        metricsaggregator:
          enableMetricAggregation: "true"
          enablePrometheusScraping: "true"
        inferenceservice:
          resources:
            limits:
              cpu: "0"
              memory: "0"
            requests:
              cpu: "0"
              memory: "0"
        opentelemetryCollector:
          resource:
            cpuLimit: "0"
            memoryLimit: "0"
            cpuRequest: "0"
            memoryRequest: "0"
    EOT

  ]

  depends_on = [helm_release.kserve_crd]
}