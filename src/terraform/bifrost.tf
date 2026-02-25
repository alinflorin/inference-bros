resource "random_string" "bifrost_pg_password" {
  length  = 32
  special = false
  upper   = false
}

resource "random_string" "bifrost_enc_key" {
  length  = 32
  special = false
  upper   = false
}

resource "helm_release" "bifrost" {
  name             = "bifrost"
  repository       = "https://maximhq.github.io/bifrost/helm-charts"
  chart            = "bifrost"
  namespace        = "bifrost"
  create_namespace = true
  atomic           = true
  wait             = true
  version          = "2.0.8"

  values = [
    <<-EOT
      bifrost:
        encryptionKey: ${sensitive(random_string.bifrost_enc_key.result)}
      postgresql:
        auth:
          password: ${sensitive(random_string.bifrost_pg_password.result)}
    EOT
    ,
    <<-EOT
      autoscaling:
        enabled: ${var.bifrost_hpa.enabled}
        minReplicas: ${var.bifrost_hpa.min_replicas}
        maxReplicas: ${var.bifrost_hpa.max_replicas}
        targetCPUUtilizationPercentage: ${var.bifrost_hpa.cpu_utilization}
        targetMemoryUtilizationPercentage: ${var.bifrost_hpa.memory_utilization}
      bifrost:
        framework:
          pricing:
            pricingUrl: 'http://control.control/bifrost/pricingSheet'
            pricingSyncInterval: 3600
        logLevel: info

        client:
          prometheusLabels: ["team", "environment", "organization", "project"]
          dropExcessRequests: true
          enableLogging: true
          enableGovernance: true
          enforceGovernanceHeader: true
          allowDirectKeys: true
          disableContentLogging: true
          logRetentionDays: 365

        providers:
          kubeai:
            keys:
              - value: "-"
                weight: 1
                name: "nokey"
            network_config:
              base_url: http://kubeai.kubeai/openai
              default_request_timeout_in_seconds: 60
            custom_provider_config:
              base_provider_type: openai
              is_key_less: true

              allowed_requests:
                list_models: true
                text_completion: true
                text_completion_stream: true
                chat_completion: true
                chat_completion_stream: true
                responses: true
                responses_stream: true
                count_tokens: true
                embedding: true
                speech: false
                speech_stream: false
                transcription: false
                transcription_stream: false
                batch_create: false
                batch_list: false
                batch_retrieve: false
                batch_cancel: false
                batch_results: false
                file_upload: false
                file_list: false
                file_retrieve: false
                file_delete: false
                file_content: false

        plugins:
          telemetry:
            enabled: true
          logging:
            enabled: true
          governance:
            enabled: true
            config:
              is_vk_mandatory: true
          otel:
            enabled: true
            config:
              service_name: "bifrost"
              collector_url: "http://tempo.monitoring.svc.cluster.local:4318/v1/traces"
              trace_type: "otel"
              protocol: "http"
      image:
        tag: 'v1.4.8'
      replicaCount: ${var.bifrost_replicas}
      storage:
        mode: postgres
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 2000m
          memory: 2Gi
      postgresql:
        enabled: true
        metrics:
          enabled: true
        primary:
          persistence:
            size: ${var.bifrost_storage_gb}Gi
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 2000m
              memory: 2Gi
      ingress:
        enabled: true
        className: nginx
        annotations:
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
          nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
          nginx.ingress.kubernetes.io/proxy-buffering: "off"
          nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
          nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
          nginx.ingress.kubernetes.io/proxy-body-size: "128m"
          nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        hosts:
          - host: bifrost.${var.domain}
            paths:
              - path: /
                pathType: Prefix
        tls:
          - secretName: bifrost-tls
            hosts:
              - bifrost.${var.domain}

    EOT

  ]

  depends_on = [helm_release.kubeai, helm_release.longhorn[0]]
}

resource "helm_release" "bifrost_service_monitor" {
  name             = "bifrost-service-monitor"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "bifrost"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: monitoring.coreos.com/v1
        kind: ServiceMonitor
        metadata:
          name: bifrost
          namespace: bifrost
        spec:
          endpoints:
          - interval: 30s
            port: http
            path: /metrics
          namespaceSelector:
            matchNames:
            - bifrost
          selector:
            matchLabels:
              app.kubernetes.io/instance: bifrost
              app.kubernetes.io/name: bifrost
    EOT

  ]

  depends_on = [helm_release.bifrost]
}


resource "helm_release" "bifrost_openai_ingress" {
  name             = "bifrost-openai-ingress"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "bifrost"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: networking.k8s.io/v1
        kind: Ingress
        metadata:
          name: bifrost-public-v1
          namespace: bifrost
          labels:
            app.kubernetes.io/instance: bifrost
            app.kubernetes.io/name: bifrost
          annotations:
            cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
            nginx.ingress.kubernetes.io/proxy-buffering: "off"
            nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-body-size: "128m"
            nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
            nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        spec:
          ingressClassName: nginx

          tls:
            - hosts:
                - bifrost.${var.domain}
              secretName: bifrost-tls

          rules:
            - host: bifrost.${var.domain}
              http:
                paths:
                  - path: /v1
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /openai
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /anthropic
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /langchain
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /litellm
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /genai
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
    EOT

  ]

  depends_on = [helm_release.bifrost]
}


resource "helm_release" "bifrost_openai_ingress_insecure" {
  name             = "bifrost-openai-ingress-insecure"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "bifrost"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: networking.k8s.io/v1
        kind: Ingress
        metadata:
          name: bifrost-public-v1-insecure
          namespace: bifrost
          annotations:
            nginx.ingress.kubernetes.io/proxy-buffering: "off"
            nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-body-size: "128m"
            nginx.ingress.kubernetes.io/ssl-redirect: 'false'
          labels:
            app.kubernetes.io/instance: bifrost
            app.kubernetes.io/name: bifrost
        spec:
          ingressClassName: nginx

          rules:
            - host: bifrost-insecure.${var.domain}
              http:
                paths:
                  - path: /v1
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /openai
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /anthropic
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /langchain
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /litellm
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
                  - path: /genai
                    pathType: Prefix
                    backend:
                      service:
                        name: bifrost
                        port:
                          number: 8080
    EOT

  ]

  count = var.bifrost_insecure_enable == true ? 1 : 0

  depends_on = [helm_release.bifrost]
}

resource "helm_release" "bifrost_grafana_dashboard" {
  name             = "bifrost-grafana-dashboard"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "monitoring"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: bifrost-grafana-dashboard
          namespace: monitoring
          labels:
            grafana_dashboard: "1"
        data:
          bifrost.json: |-
            {
              "title": "Bifrost Monitoring",
              "uid": "bifrost-kubeai-full",
              "schemaVersion": 42,
              "timezone": "browser",
              "editable": true,
              "templating": {
                "list": [
                  {
                    "name": "datasource",
                    "type": "datasource",
                    "query": "prometheus",
                    "label": "Data Source",
                    "refresh": 1
                  }
                ]
              },
              "panels": [
                {
                  "title": "Total Cost",
                  "type": "stat",
                  "gridPos": { "h": 6, "w": 8, "x": 0, "y": 0 },
                  "datasource": { "uid": "$${datasource}" },
                  "targets": [{ "expr": "sum(bifrost_cost_total{provider=\"kubeai\"})", "refId": "A" }]
                },
                {
                  "title": "Total Input Tokens",
                  "type": "stat",
                  "gridPos": { "h": 6, "w": 8, "x": 8, "y": 0 },
                  "datasource": { "uid": "$${datasource}" },
                  "targets": [{ "expr": "sum(bifrost_input_tokens_total{provider=\"kubeai\"})", "refId": "A" }]
                },
                {
                  "title": "Total Output Tokens",
                  "type": "stat",
                  "gridPos": { "h": 6, "w": 8, "x": 16, "y": 0 },
                  "datasource": { "uid": "$${datasource}" },
                  "targets": [{ "expr": "sum(bifrost_output_tokens_total{provider=\"kubeai\"})", "refId": "A" }]
                },
                {
                  "title": "Success RPM",
                  "type": "timeseries",
                  "gridPos": { "h": 8, "w": 12, "x": 0, "y": 6 },
                  "datasource": { "uid": "$${datasource}" },
                  "targets": [{ "expr": "sum(rate(bifrost_success_requests_total{provider=\"kubeai\"}[1m]))", "refId": "A" }]
                },
                {
                  "title": "Error RPM",
                  "type": "timeseries",
                  "gridPos": { "h": 8, "w": 12, "x": 12, "y": 6 },
                  "datasource": { "uid": "$${datasource}" },
                  "targets": [{ "expr": "sum(rate(bifrost_error_requests_total{provider=\"kubeai\"}[1m]))", "refId": "A" }]
                },
                {
                  "title": "P99 TTFT Trend (SLA)",
                  "type": "timeseries",
                  "gridPos": { "h": 8, "w": 24, "x": 0, "y": 14 },
                  "datasource": { "uid": "$${datasource}" },
                  "fieldConfig": { "defaults": { "unit": "s" } },
                  "targets": [{
                    "expr": "histogram_quantile(0.99, sum by (le) (rate(bifrost_stream_first_token_latency_seconds_bucket{provider=\"kubeai\"}[5m])))",
                    "refId": "A"
                  }]
                },
                {
                  "title": "First Token Latency (TTFT) Heatmap",
                  "type": "heatmap",
                  "gridPos": { "h": 10, "w": 24, "x": 0, "y": 22 },
                  "datasource": { "uid": "$${datasource}" },
                  "options": { "color": { "scheme": "Oranges" }, "calculate": { "pluginId": "histogram" } },
                  "targets": [{
                    "expr": "sum by (le) (rate(bifrost_stream_first_token_latency_seconds_bucket{provider=\"kubeai\"}[5m]))",
                    "format": "heatmap",
                    "refId": "A"
                  }]
                },
                {
                  "title": "Inter Token Latency (TPOT) Heatmap",
                  "type": "heatmap",
                  "gridPos": { "h": 10, "w": 24, "x": 0, "y": 32 },
                  "datasource": { "uid": "$${datasource}" },
                  "options": { "color": { "scheme": "Blues" }, "calculate": { "pluginId": "histogram" } },
                  "targets": [{
                    "expr": "sum by (le) (rate(bifrost_stream_inter_token_latency_seconds_bucket{provider=\"kubeai\"}[5m]))",
                    "format": "heatmap",
                    "refId": "A"
                  }]
                }
              ],
              "time": { "from": "now-6h", "to": "now" }
            }
    EOT
  ]

  depends_on = [helm_release.bifrost_service_monitor]
}
