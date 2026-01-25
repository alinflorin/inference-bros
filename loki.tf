resource "helm_release" "loki" {
  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki"
  namespace        = "monitoring"
  create_namespace = true
  version          = "6.49.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      gateway:
        enabled: false
      memcached:
        enabled: false
      resultsCache:
        enabled: false
      chunksCache:
        enabled: false
      test:
        enabled: false
      deploymentMode: SingleBinary
      lokiCanary:
        enabled: false
      loki:
        auth_enabled: false
        commonConfig:
          replication_factor: 1
        schemaConfig:
          configs:
            - from: "2024-04-01"
              store: tsdb
              object_store: filesystem
              schema: v13
              index:
                prefix: loki_index_
                period: 24h
        pattern_ingester:
          enabled: true
        storage:
          type: filesystem
      singleBinary:
        replicas: 1
        persistence:
          accessModes:
          - ReadWriteOnce
          enabled: true
          size: ${var.loki_storage_gb}Gi
        resources:
          requests:
            cpu: 50m
            memory: 128Mi
          limits:
            cpu: 100m
            memory: 256Mi
      backend:
        replicas: 0
      read:
        replicas: 0
      write:
        replicas: 0

      ingester:
        replicas: 0
      querier:
        replicas: 0
      queryFrontend:
        replicas: 0
      queryScheduler:
        replicas: 0
      distributor:
        replicas: 0
      compactor:
        replicas: 0
      indexGateway:
        replicas: 0
      bloomCompactor:
        replicas: 0
      bloomGateway:
        replicas: 0
    EOT
  ]
  count      = var.monitoring_enabled ? 1 : 0
  depends_on = [helm_release.longhorn[0]]
}