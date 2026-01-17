resource "helm_release" "kubeai" {
  name             = "kubeai"
  repository       = "https://www.kubeai.org"
  chart            = "kubeai"
  namespace        = "kubeai"
  create_namespace = true
  version          = "0.23.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resourceProfiles:
        nvidia:
          limits:
            nvidia.com/gpu: "1"
          requests:
            nvidia.com/gpu: "1"
        amd:
          limits:
            amd.com/gpu: "1"
          requests:
            amd.com/gpu: "1"
      secrets:
        huggingface:
          token: ${var.huggingface_token}
      metrics:
        prometheusOperator:
          vLLMPodMonitor:
            enabled: true
            labels: {}
      open-webui:
        enabled: false
      ingress:
        enabled: true
        className: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/configuration-snippet: |
                if ($http_authorization != "Bearer ${var.kubeai_api_key}") {
                  return 401 "Unauthorized";
                }
        rules:
          - host: kubeai.${var.domain}
            paths:
              - path: /
                pathType: ImplementationSpecific
        tls:
          - secretName: kubeai-tls
            hosts:
              - kubeai.${var.domain}
    EOT

  ]

  depends_on = [helm_release.grafana, helm_release.amd_gpu_operator, helm_release.nvidia_gpu_operator]
}

resource "helm_release" "kmm" {
  name             = "kmm"
  repository       = "oci://ghcr.io/alinflorin/charts"
  chart            = "kmm"
  namespace        = "kubeai"
  create_namespace = false
  version          = "1.0.9"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      ingress:
        enabled: true
        className: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
        hosts:
          - host: kmm.${var.domain}
            paths:
              - path: /
                pathType: ImplementationSpecific
        tls:
          - secretName: kmm-tls
            hosts:
              - kmm.${var.domain}
    EOT

  ]

  depends_on = [helm_release.kubeai]
}

resource "helm_release" "kubeai_insecure_ingress" {
  name             = "kubeai-insecure-ingress"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "kubeai"
  create_namespace = false
  version          = "0.1.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: networking.k8s.io/v1
        kind: Ingress
        metadata:
          name: kubeai-insecure
          namespace: kubeai
        spec:
          ingressClassName: nginx
          rules:
          - host: kubeai-insecure.${var.domain}
            http:
              paths:
              - pathType: Prefix
                path: "/"
                backend:
                  service:
                    name: kubeai
                    port: 
                      number: 80

    EOT

  ]

  count = var.kubeai_insecure_enable == true ? 1 : 0

  depends_on = [helm_release.kubeai]
}