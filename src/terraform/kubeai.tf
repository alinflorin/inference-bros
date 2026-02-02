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
          nodeSelector:
            nvidia.com/gpu.present: "true"
          limits:
            nvidia.com/gpu: "1"
          requests:
            nvidia.com/gpu: "1"
          runtimeClassName: nvidia
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

  depends_on = [helm_release.prometheus_operator_crds, helm_release.ingress_nginx]
}

resource "helm_release" "kubeai_hpa" {
  count = var.kubeai_hpa.enabled ? 1 : 0

  name       = "kubeai-hpa"
  repository = "https://dasmeta.github.io/helm/"
  chart      = "resource"
  namespace  = "kubeai"
  version    = "0.1.1"
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
  version    = "0.1.1"
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

  depends_on = [helm_release.longhorn[0], helm_release.kubeai]
}


resource "helm_release" "kubeai_models_explorer" {
  name       = "kubeai-models-explorer"
  repository = "https://stakater.github.io/stakater-charts"
  chart      = "application"
  namespace  = "kubeai"
  version    = "6.14.1"
  atomic     = true
  wait       = true

  values = [
    <<-EOT
      # FileBrowser Quantum Helm Chart Values
      # Application Name
      applicationName: kubeai-models-explorer

      # Deployment Configuration
      deployment:
        enabled: true
        replicas: 1

        # Container Image
        image:
          repository: gtstef/filebrowser
          tag: stable-slim
          pullPolicy: IfNotPresent

        # Environment Variables
        env:
          FILEBROWSER_CONFIG:
            value: "/home/filebrowser/config/config.yaml"
          # TZ:
          #   value: "America/New_York"

        # Container Ports
        ports:
          - containerPort: 80
            name: http
            protocol: TCP

        # Volumes
        volumes:
          db-data:
            emptyDir: {}
          config-data:
            configMap:
              name: kubeai-models-explorer-config
          files:
            persistentVolumeClaim:
              claimName: models

        # Volume Mounts
        volumeMounts:
          db-data:
            mountPath: /home/filebrowser/data
          config-data:
            mountPath: /home/filebrowser/config
          files:
            mountPath: /folder

        # Security Context - Run as non-root user
        containerSecurityContext:
          readOnlyRootFilesystem: false
          runAsNonRoot: true
          runAsUser: 1000
          runAsGroup: 1000

        securityContext:
          fsGroup: 1000

        # Health Probes
        readinessProbe:
          enabled: true
          httpGet:
            path: /health
            port: http
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3

        livenessProbe:
          enabled: true
          httpGet:
            path: /health
            port: http
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3

        # Resource Limits
        resources:
          requests:
            memory: 128Mi
            cpu: 50m
          limits:
            memory: 256Mi
            cpu: 100m


      # Service Configuration
      service:
        enabled: true
        type: ClusterIP
        ports:
          - port: 80
            name: http
            protocol: TCP
            targetPort: http

      # Ingress Configuration (Optional - Enable if needed)
      ingress:
        enabled: true
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
          nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
          nginx.ingress.kubernetes.io/proxy-buffering: "off"
          nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
          nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
          nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
        ingressClassName: "nginx"
        hosts:
          - host: models.${var.domain}
            paths:
              - path: /
                pathType: Prefix
                serviceName: kubeai-models-explorer
                servicePort: http
        tls:
          - secretName: models-tls
            hosts:
              - models.${var.domain}

      persistence:
        enabled: false

      configMap:
        enabled: true
        files:
          config:
            config.yaml: |
              userDefaults:
                showHidden: true
                disableUpdateNotifications: true
                fileLoading:
                  maxConcurrentUpload: 10
                  uploadChunkSizeMb: 100
              server:
                disableUpdateCheck: true
                disablePreviews: true

                database: /home/filebrowser/data/filebrowser.db
                sources:
                  - path: /folder
                    config:
                      defaultEnabled: true
              auth:
                methods:
                  noauth: true
              frontend:
                disableDefaultLinks: true
                name: "KubeAI Models Explorer"
                externalLinks: []


      # RBAC Configuration
      rbac:
        enabled: true
        serviceAccount:
          enabled: true
          name: "filebrowser-sa"
    EOT
  ]

  depends_on = [helm_release.kubeai_models_pvc]
}
