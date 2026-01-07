resource "helm_release" "longhorn" {
  name       = "longhorn"
  repository = "https://charts.longhorn.io"
  chart      = "longhorn"
  namespace  = "longhorn-system"
  create_namespace = true
  version = "1.10.1"
  atomic          = true
  wait            = true
  timeout = 500

  values = [
    <<-EOT
      longhornUI:
        replicas: 1
      ingress:
        enabled: true
        ingressClassName: nginx
        host: longhorn.${var.domain}
        tls: true
        tlsSecret: longhorn-tls
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
          nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
          nginx.ingress.kubernetes.io/proxy-buffering: "off"
          nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
          nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
      metrics:
        serviceMonitor:
          enabled: true
      defaultSettings:
        storageReservedPercentageForDefaultDisk: 1
        guaranteedInstanceManagerCPU: 0
        allowCollectingLonghornUsageMetrics: false
        storageMinimalAvailablePercentage: 1
        deletingConfirmationFlag: true
        
      csi:
        attacherReplicaCount: 1
        provisionerReplicaCount: 1
        resizerReplicaCount: 1
        snapshotterReplicaCount: 1
        
    EOT

  ]

  depends_on = [helm_release.oauth2_proxy]
}