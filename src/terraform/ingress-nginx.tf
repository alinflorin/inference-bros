resource "helm_release" "ingress_nginx" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
  version          = "4.14.2"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      controller:
        ingressClassResource:
          default: true
        autoscaling:
          enabled: ${var.nginx_hpa.enabled}
          minReplicas: ${var.nginx_hpa.min_replicas}
          maxReplicas: ${var.nginx_hpa.max_replicas}
          targetCPUUtilizationPercentage: ${var.nginx_hpa.cpu_utilization}
          targetMemoryUtilizationPercentage: ${var.nginx_hpa.memory_utilization}
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 1000m
            memory: 512Mi
        replicaCount: ${var.nginx_replicas}
        config:
          annotations-risk-level: Critical
          enable-opentelemetry: "true"
          otlp-collector-host: tempo.monitoring.svc.cluster.local
          otlp-collector-port: "4317"
          otel-service-name: ingress-nginx
          opentelemetry-trust-incoming-span: "true"
          otel-sampler: AlwaysOn
        allowSnippetAnnotations: true
        service:
          loadBalancerIP: "${var.nginx_metallb_ip}"
          ${var.enable_dns == true && var.public_ip != "" && var.public_ip != null && var.dns_type == "external-dns" ? "externalIPs: [${var.public_ip}]" : ""}
        metrics:
          enabled: true
          serviceMonitor:
            enabled: true
    EOT

  ]

  depends_on = [helm_release.prometheus_operator_crds]
}
