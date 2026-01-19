resource "helm_release" "kube_prometheus_stack" {
  name             = "prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = "monitoring"
  create_namespace = true
  version          = "80.13.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      alertmanager:
        ingress:
          enabled: true
          ingressClassName: "nginx"
          annotations:
            nginx.ingress.kubernetes.io/ssl-redirect: 'true'
            cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
            nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
            nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
            nginx.ingress.kubernetes.io/proxy-buffering: "off"
            nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
            nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
          hosts:
            - alertmanager.${var.domain}
          paths:
            - /
          pathType: ImplementationSpecific

          tls: 
            - secretName: alertmanager-tls
              hosts:
                - alertmanager.${var.domain}
        config:
          inhibit_rules: []
          route:
            receiver: 'slack' # default receiver
            routes:
              # Ensure alerting pipeline is functional
              - receiver: 'null'
                matchers:
                  - alertname = "Watchdog"
              # Redirect all severity to slack
              - receiver: 'slack'
                matchers:
                  - severity =~ info|critical|warning
          receivers:
          - name: "null"
          - name: slack
            slack_configs:
            - channel: '#grafana-alerts'
              send_resolved: true
              api_url: ${var.slack_webhook_url}
              # Alert template
              title: |
                [{{ .Status | toUpper -}}
                {{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{- end -}}
                ] {{ .CommonLabels.alertname }}
              text: |-
                {{ range .Alerts -}}
                *Severity:* `{{ .Labels.severity }}`
                *Summary:* {{ .Annotations.summary }}
                *Description:* {{ .Annotations.description }}
                *Details:*
                  • *env:* ${var.location}
                  {{ range .Labels.SortedPairs }} • *{{ .Name }}:* `{{ .Value }}`
                  {{ end }}
                {{ end }}
              actions:
                - type: button
                  text: 'Runbook :green_book:'
                  url: '{{ (index .Alerts 0).Annotations.runbook_url }}'
                - type: button
                  text: 'Query :mag:'
                  url: '{{ (index .Alerts 0).GeneratorURL }}'
                - type: button
                  text: 'Silence :no_bell:'
                  url: |
                    {{ .ExternalURL }}/#/silences/new?filter=%7B
                    {{- range .CommonLabels.SortedPairs -}}
                        {{- if ne .Name "alertname" -}}
                            {{- .Name }}%3D"{{- .Value -}}"%2C%20
                        {{- end -}}
                    {{- end -}}
                    alertname%3D"{{- .CommonLabels.alertname -}}"%7D
        alertmanagerSpec:
          storage: 
            volumeClaimTemplate:
              spec:
                accessModes:
                - ReadWriteOnce
                resources:
                  requests: 
                    storage: ${var.alertmanager_storage_gb}Gi
          externalUrl: https://alertmanager.${var.domain}
          retention: "72h"
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
      crds:
        enabled: false
        upgradeJob:
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
      grafana:
        enabled: false
      prometheus:
        prometheusSpec:
          serviceMonitorSelectorNilUsesHelmValues: false
          podMonitorSelectorNilUsesHelmValues: false
          namespaceMonitorSelectorNilUsesHelmValues: false
          ruleSelectorNilUsesHelmValues: false
          probeSelectorNilUsesHelmValues: false
          retention: 3d
          storageSpec:
            volumeClaimTemplate:
              spec:
                accessModes: ["ReadWriteOnce"]
                resources:
                  requests:
                    storage: ${var.prometheus_storage_gb}Gi
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 1Gi
      prometheusOperator:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
        admissionWebhooks:
          deployment:
            resources:
              requests:
                cpu: 100m
                memory: 128Mi
              limits:
                cpu: 200m
                memory: 256Mi
        prometheusConfigReloader:
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
      thanosRuler:
        enabled: false
        thanosRulerSpec:
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 200m
              memory: 256Mi
      nodeExporter:
        resources:
          limits:
            cpu: 100m
            memory: 128Mi
          requests:
            cpu: 50m
            memory: 64Mi
      kube-state-metrics:
        resources:
          limits:
            cpu: 100m
            memory: 128Mi
          requests:
            cpu: 50m
            memory: 64Mi
    EOT

  ]

  depends_on = [helm_release.longhorn[0]]
}