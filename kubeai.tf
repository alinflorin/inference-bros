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
      cacheProfiles:
        storage:
          sharedFilesystem:
            storageClassName: "${var.longhorn_enabled ? "longhorn" : "local-path"}"
      replicaCount: ${var.kubeai_proxy_replicas}
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
      resources:
        requests:
          cpu: "200m"
          memory: "256Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
    EOT

  ]

  depends_on = [helm_release.prometheus_operator_crds]
}

resource "helm_release" "kubeai_hpa" {
  count = var.kubeai_hpa.enabled ? 1 : 0

  name       = "kubeai-hpa"
  repository = "https://dasmeta.github.io/helm/"
  chart      = "resource"
  namespace  = "kubeai"
  version    = "0.1.0"
  atomic     = true
  wait       = true

  values = [
    <<-EOT
      resource:
        apiVersion: autoscaling/v2
        kind: HorizontalPodAutoscaler
        metadata:
          name: kubeai
        spec:
          scaleTargetRef:
            apiVersion: apps/v1
            kind: Deployment
            name: kubeai
          minReplicas: ${var.kubeai_hpa.min_replicas}
          maxReplicas: ${var.kubeai_hpa.max_replicas}
          metrics:
            - type: Resource
              resource:
                name: cpu
                target:
                  type: Utilization
                  averageUtilization: ${var.kubeai_hpa.cpu_utilization}
            - type: Resource
              resource:
                name: memory
                target:
                  type: Utilization
                  averageUtilization: ${var.kubeai_hpa.memory_utilization}
    EOT
  ]

  depends_on = [helm_release.kubeai]
}


resource "helm_release" "kubeai_models_pvc" {
  name       = "kubeai-models-pvc"
  repository = "https://dasmeta.github.io/helm/"
  chart      = "resource"
  namespace  = "kubeai"
  version    = "0.1.0"
  atomic     = false
  wait       = false

  values = [
    <<-EOT
      resource:
        apiVersion: v1
        kind: PersistentVolumeClaim
        metadata:
          name: models
          namespace: kubeai
        spec:
          accessModes:
            - ${var.longhorn_enabled ? "ReadWriteMany" : "ReadWriteOnce"}
          resources:
            requests:
              storage: ${var.kubeai_pvc_storage_gb}Gi
    EOT
  ]

  depends_on = [helm_release.longhorn[0]]
}

resource "helm_release" "kubeai_models_pvc_browser" {
  name       = "kubeai-models-pvc-browser"
  repository = "https://utkuozdemir.org/helm-charts"
  chart      = "filebrowser"
  namespace  = "kubeai"
  version    = "1.0.0"
  atomic     = true
  wait       = true

  values = [
    <<-EOT
      config:
        auth:
          method: noauth
        baseURL: /
        directory:
          showHidden: true
      db:
        pvc:
          enabled: false
      rootDir:
        pvc:
          existingClaim: models
      resources:
        requests:
          cpu: "50m"
          memory: "128Mi"
        limits:
          cpu: "100m"
          memory: "256Mi"
      ingress:
        enabled: true
        className: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
          nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
          nginx.ingress.kubernetes.io/proxy-buffering: "off"
          nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
          nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
        hosts:
          - host: "models.${var.domain}"
            paths:
              - path: /
                pathType: Prefix
        tls:
          - secretName: "models-tls"
            hosts:
              - "models.${var.domain}"
    EOT
  ]

  depends_on = [helm_release.kubeai_models_pvc]
}

