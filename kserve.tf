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

resource "helm_release" "models_web_app" {
  name             = "models-web-app"
  chart            = "${path.module}/charts/models-web-app"
  namespace        = "kserve"
  create_namespace = true
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      allowedNamespaces: llms
      ingressAnnotations:
        nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
        nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
        nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
        nginx.ingress.kubernetes.io/proxy-buffering: "off"
        nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
        nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
      host: kserve-models.${var.domain}
    EOT

  ]

  depends_on = [helm_release.kserve]
}

resource "helm_release" "llms_namespace" {
  name             = "llms"
  repository       = "https://ameijer.github.io/k8s-as-helm"
  chart            = "namespace"
  namespace        = "default"
  create_namespace = false
  version          = "1.1.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      nameOverride: llms
    EOT

  ]

  depends_on = [helm_release.kserve]
}

resource "helm_release" "hf_secret" {
  name             = "hf-secret"
  repository       = "https://ameijer.github.io/k8s-as-helm"
  chart            = "secret"
  namespace        = "llms"
  create_namespace = false
  version          = "1.0.4"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      nameOverride: hf-secret
      secretData:
        HF_TOKEN: ${var.huggingface_token}
    EOT

  ]

  depends_on = [helm_release.llms_namespace]
}

resource "helm_release" "hf_csc" {
  name             = "hf-csc"
  chart            = "${path.module}/charts/hf-csc"
  namespace        = "llms"
  create_namespace = false
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      secretName: hf-secret
      secretKey: HF_TOKEN
    EOT

  ]

  depends_on = [helm_release.llms_namespace]
}