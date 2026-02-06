resource "helm_release" "generic" {
  name             = var.name
  repository       = "https://stakater.github.io/stakater-charts"
  chart            = "application"
  namespace        = var.namespace
  create_namespace = true
  version          = "6.14.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      applicationName: "${var.name}"
      deployment:
        enabled: true
        additionalPodAnnotations:
          terraform.io/app-checksum: "${md5(file("${path.root}/apps/${var.name}/index.mjs"))}-${md5(file("${path.root}/apps/${var.name}/index.html"))}"
        env:
          ${indent(4, yamlencode(merge(
    {
      NODE_ENV = { value = "production" }
      LOCATION = { value = var.location }
    },
    { for k, v in var.env : k => { value = v } }
)))}
        terminationGracePeriodSeconds: ${var.termination_grace_period_seconds}
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
          - port: 80
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
          ${var.enable_auth == true ? "nginx.ingress.kubernetes.io/proxy-connect-timeout: \"3600\"" : ""}
        hosts:
          - host: "${var.ingress_subdomain == "" ? var.name : var.ingress_subdomain}.${var.domain}"
            paths:
              - path: "${var.ingress_path}"
                pathType: Prefix
        tls:
          - secretName: "${var.name}-tls"
            hosts:
              - "${var.ingress_subdomain == "" ? var.name : var.ingress_subdomain}.${var.domain}"
      ${indent(0, file("${path.root}/apps/${var.name}/extra.yaml"))}
      rbac:
        enabled: true
        serviceAccount:
          enabled: true
          name: ${var.name}-sa
        ${indent(2, file("${path.root}/apps/${var.name}/roles.yaml"))}
      configMap:
        enabled: true
        files:
         app:
            ${indent(12, yamlencode({
              "index.mjs"  = file("${path.root}/apps/${var.name}/index.mjs")
              "index.html" = file("${path.root}/apps/${var.name}/index.html")
            }))}
    EOT
]

}
