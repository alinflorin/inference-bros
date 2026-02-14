resource "helm_release" "goldilocks" {
  name             = "goldilocks"
  repository       = "https://charts.fairwinds.com/stable"
  chart            = "goldilocks"
  namespace        = "goldilocks"
  create_namespace = true
  version          = "10.2.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      vpa:
        enabled: true
        admissionController:
          resources:
            limits:
              
              memory: 90Mi
            requests:
              cpu: 50m
              memory: 30Mi
        updater:
          enabled: false
          resources:
            limits:
              
              memory: 90Mi
            requests:
              cpu: 50m
              memory: 30Mi
        recommender:
          extraArgs:
            prometheus-address: |
              http://prometheus-operated.monitoring.svc.cluster.local:9090
            storage: prometheus
          resources:
            limits:
              
              memory: 90Mi
            requests:
              cpu: 50m
              memory: 30Mi
      image:
        pullPolicy: IfNotPresent
      controller:
        flags:
          on-by-default: true
        resources:
          requests:
            cpu: 100m
            memory: 50Mi
          limits:
            
            memory: 100Mi
      dashboard:
        replicaCount: 1
        resources:
          requests:
            cpu: 50m
            memory: 30Mi
          limits:
            
            memory: 90Mi
        ingress:
          enabled: true
          ingressClassName: nginx
          annotations:
            nginx.ingress.kubernetes.io/ssl-redirect: 'true'
            cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
            nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
            nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
            nginx.ingress.kubernetes.io/proxy-buffering: "off"
            nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
          hosts:
            - host: goldilocks.${var.domain}
              paths:
                - path: /
                  type: ImplementationSpecific
          tls:
            - secretName: goldilocks-tls
              hosts:
                - goldilocks.${var.domain}
    EOT

  ]

  count      = var.vpa_enabled ? 1 : 0
  depends_on = [helm_release.kube_prometheus_stack]
}
