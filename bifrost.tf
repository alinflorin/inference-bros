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
  version          = "1.5.2"

  values = [
    <<-EOT
      bifrost:

        encryptionKey: ${random_string.bifrost_enc_key.result}
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
                speech: true
                speech_stream: true
                transcription: true
                transcription_stream: true
                batch_create: true
                batch_list: true
                batch_retrieve: true
                batch_cancel: true
                batch_results: true
                file_upload: true
                file_list: true
                file_retrieve: true
                file_delete: true
                file_content: true
        
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
              collector_url: "tempo.monitoring.svc.cluster.local:4318"
              trace_type: "otel"
              protocol: "http"
      image:
        tag: 'v1.4.1'
      replicaCount: ${var.bifrost_replicas}
      storage:
        mode: postgres
      resources:
        requests:
          cpu: 200m
          memory: 256Mi
        limits:
          cpu: 2000m
          memory: 2Gi
      postgresql:
        enabled: true
        auth:
          password: ${random_string.bifrost_pg_password.result}
        primary:
          persistence:
            size: ${var.bifrost_storage_gb}Gi
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1Gi
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

  depends_on = [helm_release.kmm]
}

resource "helm_release" "bifrost_service_monitor" {
  name             = "bifrost-service-monitor"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "bifrost"
  create_namespace = true
  version          = "0.1.0"
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
  version          = "0.1.0"
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
  version          = "0.1.0"
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
    EOT

  ]

  count = var.bifrost_insecure_enable == true ? 1 : 0

  depends_on = [helm_release.bifrost]
}