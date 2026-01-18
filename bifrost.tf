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
  version = "1.5.2"

  values = [
    <<-EOT
      bifrost:
        governance:
          authConfig:
            enabled: true
            adminUsername: "${var.bifrost_user}"
            adminPassword: "${var.bifrost_password}"
        encryptionKey: ${random_string.bifrost_enc_key.result}
        logLevel: info
        
        client:
          dropExcessRequests: true
          enableLogging: true
          enableGovernance: true
        
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
              collector_url: "http://tempo.monitoring.svc.cluster.local:4317"
              trace_type: "otel"
              protocol: "grpc"
      image:
        tag: 'v1.3.63'
      replicaCount: ${var.bifrost_replicas}
      storage:
        mode: postgres
      resources:
        requests:
          cpu: '0'
          memory: '0'
        limits:
          cpu: '0'
          memory: '0'
      postgresql:
        enabled: true
        auth:
          password: ${random_string.bifrost_pg_password.result}
        primary:
          persistence:
            size: ${var.bifrost_storage_gb}Gi
          resources:
            requests:
              cpu: '0'
              memory: '0'
            limits:
              cpu: '0'
              memory: '0'
      ingress:
        enabled: true
        className: nginx
        annotations:
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
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