resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
  version          = "4.14.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      controller:
        resources:
          requests:
            cpu: 100m
            memory: 90Mi
          limits:
            cpu: 250m
            memory: 512Mi
        replicaCount: ${var.nginx_replicas}
        config:
          annotations-risk-level: Critical
          enable-opentelemetry: "true"
          otlp-collector-host: tempo.monitoring.svc.cluster.local
          otlp-collector-port: "4317"
          otel-service-name: ingress-nginx
          otel-sampler: AlwaysOn
        allowSnippetAnnotations: true
        service:
          loadBalancerIP: "${var.nginx_metallb_ip}"
        metrics:
          enabled: true
          serviceMonitor:
            enabled: true
    EOT

  ]

  depends_on = [helm_release.prometheus_operator_crds]
}