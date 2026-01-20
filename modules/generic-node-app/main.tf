resource "helm_release" "generic" {
  name             = var.name
  repository       = "https://stakater.github.io/stakater-charts"
  chart            = "application"
  namespace        = var.namespace
  create_namespace = true
  version          = "6.14.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      applicationName: "${var.name}"
      deployment:
        enabled: true
        resources:
          limits:
            cpu: ${var.cpu_limit != "" ? var.cpu_limit : "null"}
            memory: ${var.memory_limit != "" ? var.memory_limit : "null"}
          requests:
            cpu: ${var.cpu_request != "" ? var.cpu_request : "null"}
            memory: ${var.memory_request != "" ? var.memory_request : "null"}
        containerSecurityContext:
          readOnlyRootFilesystem: false
          runAsNonRoot: false
        volumes:
          app:
            configMap:
              name: '${var.name}-app'
        volumeMounts:
          app:
             mountPath: /app
        replica: ${var.replicas}
        image:
          repository: "node"
          tag: "25-alpine"
        command: ["/bin/sh", "-c"]
        args:
          - cd /app && node index.mjs
        ports:
          - containerPort: 8080
            name: http
            protocol: TCP
      service:
        enabled: ${var.service_enabled == true ? "true" : "false"}
        ports:
          - port: 8080
            targetPort: http
            protocol: TCP
            name: http
      ingress:
        enabled: ${var.ingress_enabled == true ? "true" : "false"}
        ingressClassName: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
          ${var.enable_auth == true ? "nginx.ingress.kubernetes.io/auth-url: \"http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth\"" : ""}
          ${var.enable_auth == true ? "nginx.ingress.kubernetes.io/auth-signin: \"https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri\"" : ""}
          ${var.enable_auth == true ? "nginx.ingress.kubernetes.io/proxy-buffering: \"off\"" : ""}
          ${var.enable_auth == true ? "nginx.ingress.kubernetes.io/proxy-read-timeout: \"3600\"" : ""}
          ${var.enable_auth == true ? "nginx.ingress.kubernetes.io/proxy-send-timeout: \"3600\"" : ""}
        hosts:
          - host: "${var.name}.${var.domain}"
            paths:
              - path: "/"
                pathType: Prefix
        tls:
          - secretName: "${var.name}-tls"
            hosts:
              - "${var.name}.${var.domain}"
      rbac:
        enabled: true
        serviceAccount:
          enabled: true
          name: ${var.name}-sa
        roles: []
      configMap:
        enabled: true
        files:
         app:
            index.mjs: |
              ${indent(14, file("${path.root}/apps/${var.name}/index.mjs"))}
    EOT
  ]

}
