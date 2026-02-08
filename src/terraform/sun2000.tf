module "sun2000" {
  source          = "./modules/generic-node-app"
  namespace       = "monitoring"
  name            = "sun2000"
  location        = var.location
  domain          = var.domain
  ingress_enabled = false
  service_enabled = true
  cpu_request     = "25m"
  memory_request  = "32Mi"
  cpu_limit       = "50m"
  memory_limit    = "64Mi"
  depends_on      = [helm_release.kube_prometheus_stack]
  env = {
    "KIOSK_URL"       = var.sun2000_kiosk_url
    "KIOSK_KK"        = var.sun2000_kiosk_kk
    "SCRAPE_INTERVAL" = "300"
  }

  count = var.sun2000_enabled ? 1 : 0
}

resource "helm_release" "sun2000_service_monitor" {
  name             = "sun2000-service-monitor"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "monitoring"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: monitoring.coreos.com/v1
        kind: ServiceMonitor
        metadata:
          name: sun2000
          namespace: monitoring
        spec:
          endpoints:
          - interval: 60s
            port: http
            path: /metrics
          namespaceSelector:
            matchNames:
            - monitoring
          selector:
            matchLabels:
              app.kubernetes.io/instance: sun2000
              app.kubernetes.io/name: sun2000
    EOT
  ]

  count = var.sun2000_enabled ? 1 : 0

  depends_on = [module.sun2000]
}

resource "helm_release" "sun2000_grafana_dashboard" {
  name             = "sun2000-grafana-dashboard"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "monitoring"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: sun2000-grafana-dashboard
          namespace: monitoring
          labels:
            grafana_dashboard: "1"
        data:
          sun2000.json: |-
            {
              "annotations": { "list": [] },
              "editable": true,
              "fiscalYearStartMonth": 0,
              "graphTooltip": 1,
              "panels": [
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "red", "value": null },
                          { "color": "orange", "value": 0.1 },
                          { "color": "green", "value": 1 }
                        ]
                      },
                      "unit": "kwatt",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 6, "x": 0, "y": 0 },
                  "id": 1,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "area",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"] },
                    "textMode": "auto"
                  },
                  "title": "Current Power",
                  "type": "stat",
                  "targets": [
                    {
                      "expr": "sun2000_real_time_power_kw",
                      "legendFormat": "Power",
                      "refId": "A"
                    }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "blue", "value": null },
                          { "color": "green", "value": 1 }
                        ]
                      },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 6, "x": 6, "y": 0 },
                  "id": 2,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"] },
                    "textMode": "auto"
                  },
                  "title": "Today",
                  "type": "stat",
                  "targets": [
                    {
                      "expr": "sun2000_daily_energy_kwh",
                      "legendFormat": "Daily",
                      "refId": "A"
                    }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "blue", "value": null },
                          { "color": "green", "value": 10 }
                        ]
                      },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 6, "x": 12, "y": 0 },
                  "id": 3,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"] },
                    "textMode": "auto"
                  },
                  "title": "This Month",
                  "type": "stat",
                  "targets": [
                    {
                      "expr": "sun2000_month_energy_kwh",
                      "legendFormat": "Monthly",
                      "refId": "A"
                    }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "blue", "value": null },
                          { "color": "green", "value": 100 }
                        ]
                      },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 6, "x": 18, "y": 0 },
                  "id": 4,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"] },
                    "textMode": "auto"
                  },
                  "title": "This Year",
                  "type": "stat",
                  "targets": [
                    {
                      "expr": "sun2000_year_energy_kwh",
                      "legendFormat": "Yearly",
                      "refId": "A"
                    }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "palette-classic" },
                      "custom": {
                        "axisBorderShow": false,
                        "axisCenteredZero": false,
                        "axisLabel": "Power (kW)",
                        "drawStyle": "line",
                        "fillOpacity": 30,
                        "gradientMode": "opacity",
                        "lineInterpolation": "smooth",
                        "lineWidth": 2,
                        "pointSize": 5,
                        "showPoints": "auto",
                        "spanNulls": false
                      },
                      "unit": "kwatt",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 10, "w": 24, "x": 0, "y": 6 },
                  "id": 5,
                  "options": {
                    "legend": { "calcs": ["mean", "max"], "displayMode": "table", "placement": "bottom" },
                    "tooltip": { "mode": "single" }
                  },
                  "title": "Power Output Over Time",
                  "type": "timeseries",
                  "targets": [
                    {
                      "expr": "sun2000_real_time_power_kw",
                      "legendFormat": "Power (kW)",
                      "refId": "A"
                    }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "palette-classic" },
                      "custom": {
                        "axisBorderShow": false,
                        "axisCenteredZero": false,
                        "axisLabel": "Energy (kWh)",
                        "drawStyle": "line",
                        "fillOpacity": 20,
                        "gradientMode": "opacity",
                        "lineInterpolation": "smooth",
                        "lineWidth": 2,
                        "pointSize": 5,
                        "showPoints": "auto",
                        "spanNulls": false
                      },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 10, "w": 24, "x": 0, "y": 16 },
                  "id": 6,
                  "options": {
                    "legend": { "calcs": ["lastNotNull"], "displayMode": "table", "placement": "bottom" },
                    "tooltip": { "mode": "single" }
                  },
                  "title": "Daily Energy Production",
                  "type": "timeseries",
                  "targets": [
                    {
                      "expr": "sun2000_daily_energy_kwh",
                      "legendFormat": "Daily (kWh)",
                      "refId": "A"
                    }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "blue", "value": null },
                          { "color": "green", "value": 500 }
                        ]
                      },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 12, "x": 0, "y": 26 },
                  "id": 7,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"] },
                    "textMode": "auto"
                  },
                  "title": "Lifetime Production",
                  "type": "stat",
                  "targets": [
                    {
                      "expr": "sun2000_cumulative_energy_kwh",
                      "legendFormat": "Cumulative",
                      "refId": "A"
                    }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "red", "value": null },
                          { "color": "green", "value": 1 }
                        ]
                      },
                      "mappings": [
                        { "options": { "0": { "text": "FAIL" }, "1": { "text": "OK" } }, "type": "value" }
                      ]
                    }
                  },
                  "gridPos": { "h": 6, "w": 12, "x": 12, "y": 26 },
                  "id": 8,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"] },
                    "textMode": "auto"
                  },
                  "title": "Scrape Status",
                  "type": "stat",
                  "targets": [
                    {
                      "expr": "sun2000_scrape_success",
                      "legendFormat": "Status",
                      "refId": "A"
                    }
                  ]
                }
              ],
              "schemaVersion": 39,
              "templating": {
                "list": [
                  {
                    "current": { "selected": false, "text": "Prometheus", "value": "prometheus" },
                    "hide": 0,
                    "includeAll": false,
                    "name": "datasource",
                    "options": [],
                    "query": "prometheus",
                    "refresh": 1,
                    "type": "datasource"
                  }
                ]
              },
              "time": { "from": "now-24h", "to": "now" },
              "title": "Sun2000 Solar Inverter",
              "uid": "sun2000-solar",
              "version": 1
            }
    EOT
  ]

  count = var.sun2000_enabled ? 1 : 0

  depends_on = [helm_release.kube_prometheus_stack]
}
