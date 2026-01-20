resource "helm_release" "generic" {
  name             = "generic"
  repository       = "https://stakater.github.io/stakater-charts"
  chart            = "application"
  namespace        = "generic"
  create_namespace = true
  version          = "6.14.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      applicationName: "generic"
      deployment:
        enabled: true
        containerSecurityContext:
          readOnlyRootFilesystem: false
          runAsNonRoot: false
        volumes:
          app:
            configMap:
              name: 'generic-app'
        volumeMounts:
          app:
             mountPath: /app
        replica: 1
        image:
          repository: "node"
          tag: "25-alpine"
        command: ["/bin/sh", "-c"]
        args:
          - cd /app && (npm ci || true) && npm start
        ports:
          - containerPort: 8080
            name: http
            protocol: TCP
      service:
        enabled: true
        ports:
          - port: 8080
            targetPort: http
            protocol: TCP
            name: http
      ingress:
        enabled: true
        ingressClassName: "nginx"
        annotations:
          nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
        hosts:
          - host: "generic.${var.domain}"
            paths:
              - path: "/"
                pathType: Prefix
        tls:
          - secretName: "generic-tls"
            hosts:
              - "generic.${var.domain}"
      rbac:
        enabled: true
        serviceAccount:
          enabled: true
          name: generic-sa
        roles:
          - name: read-configmaps
            rules:
              - apiGroups:
                  - ""
                resources:
                  - configmaps
                verbs:
                  - get
      configMap:
        enabled: true
        files:
         app:
            index.js: |
              ${indent(14, file("${path.module}/apps/generic/index.js"))}
            package.json: |
              ${indent(14, file("${path.module}/apps/generic/package.json"))}
            package-lock.json: |
              ${indent(14, file("${path.module}/apps/generic/package-lock.json"))}
    EOT
  ]

  depends_on = [helm_release.kubeai]
}
