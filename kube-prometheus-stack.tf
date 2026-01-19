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
        templateFiles:
            monzo-templates.tmpl: |-
              # This builds the silence URL.  We exclude the alertname in the range
              # to avoid the issue of having trailing comma separator (%2C) at the end
              # of the generated URL
              {{ define "__alert_silence_link" -}}
                  {{ .ExternalURL }}/#/silences/new?filter=%7B
                  {{- range .CommonLabels.SortedPairs -}}
                      {{- if ne .Name "alertname" -}}
                          {{- .Name }}%3D"{{- .Value -}}"%2C%20
                      {{- end -}}
                  {{- end -}}
                  alertname%3D"{{ .CommonLabels.alertname }}"%7D
              {{- end }}



              {{ define "__alert_severity_prefix" -}}
                  {{ if ne .Status "firing" -}}
                  :lgtm:
                  {{- else if eq .Labels.severity "critical" -}}
                  :fire:
                  {{- else if eq .Labels.severity "warning" -}}
                  :warning:
                  {{- else -}}
                  :question:
                  {{- end }}
              {{- end }}

              {{ define "__alert_severity_prefix_title" -}}
                  {{ if ne .Status "firing" -}}
                  :lgtm:
                  {{- else if eq .CommonLabels.severity "critical" -}}
                  :fire:
                  {{- else if eq .CommonLabels.severity "warning" -}}
                  :warning:
                  {{- else if eq .CommonLabels.severity "info" -}}
                  :information_source:
                  {{- else -}}
                  :question:
                  {{- end }}
              {{- end }}


              {{/* First line of Slack alerts */}}
              {{ define "slack.monzo.title" -}}
                  [{{ .Status | toUpper -}}
                  {{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{- end -}}
                  ] {{ template "__alert_severity_prefix_title" . }} {{ .CommonLabels.alertname }}
              {{- end }}


              {{/* Color of Slack attachment (appears as line next to alert )*/}}
              {{ define "slack.monzo.color" -}}
                  {{ if eq .Status "firing" -}}
                      {{ if eq .CommonLabels.severity "warning" -}}
                          warning
                      {{- else if eq .CommonLabels.severity "critical" -}}
                          danger
                      {{- else -}}
                          #439FE0
                      {{- end -}}
                  {{ else -}}
                  good
                  {{- end }}
              {{- end }}


              {{/* Emoji to display as user icon (custom emoji supported!) */}}
              {{ define "slack.monzo.icon_emoji" }}:prometheus:{{ end }}

              {{/* The test to display in the alert */}}
              {{ define "slack.monzo.text" -}}
                  {{ range .Alerts }}
                      {{- if .Annotations.message }}
                          {{ .Annotations.message }}
                      {{- end }}
                      {{- if .Annotations.description }}
                          {{ .Annotations.description }}
                      {{- end }}
                  {{- end }}
              {{- end }}



              {{- /* If none of the below matches, send to #monitoring-no-owner, and we 
              can then assign the expected code_owner to the alert or map the code_owner
              to the correct channel */ -}}
              {{ define "__get_channel_for_code_owner" -}}
                  {{- if eq . "platform-team" -}}
                      platform-alerts
                  {{- else if eq . "security-team" -}}
                      security-alerts
                  {{- else -}}
                      monitoring-no-owner
                  {{- end -}}
              {{- end }}

              {{- /* Select the channel based on the code_owner. We only expect to get
              into this template function if the code_owners label is present on an alert.
              This is to defend against us accidentally breaking the routing logic. */ -}}
              {{ define "slack.monzo.code_owner_channel" -}}
                  {{- if .CommonLabels.code_owner }}
                      {{ template "__get_channel_for_code_owner" .CommonLabels.code_owner }}
                  {{- else -}}
                      monitoring
                  {{- end }}
              {{- end }}

              {{ define "slack.monzo.link_button_text" -}}
                  {{- if .CommonAnnotations.link_text -}}
                      {{- .CommonAnnotations.link_text -}}
                  {{- else -}}
                      Link
                  {{- end }} :link:
              {{- end }}
        templates:
          - '/etc/alertmanager/config/*.tmpl'
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
            group_by: ['alertname', 'cluster', 'service']
            group_wait: 30s
            group_interval: 5m
            repeat_interval: 12h
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
              title: '{{ template "slack.monzo.title" . }}'
              color: '{{ template "slack.monzo.color" . }}'
              text: '{{ template "slack.monzo.text" . }}'
              actions:
              - type: button
                text: 'Runbook :green_book:'
                url: '{{ (index .Alerts 0).Annotations.runbook }}'
              - type: button
                text: 'Query :mag:'
                url: '{{ (index .Alerts 0).GeneratorURL }}'
              - type: button
                text: 'Dashboard :grafana:'
                url: '{{ (index .Alerts 0).Annotations.dashboard }}'
              - type: button
                text: 'Silence :no_bell:'
                url: '{{ template "__alert_silence_link" . }}'
              - type: button
                text: '{{ template "slack.monzo.link_button_text" . }}'
                url: '{{ .CommonAnnotations.link_url }}'


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