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
  cpu_limit       = "100m"
  memory_limit    = "90Mi"
  depends_on      = [helm_release.kube_prometheus_stack]
  env = {
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
                  "gridPos": { "h": 6, "w": 4, "x": 0, "y": 0 },
                  "id": 1,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "area",
                    "justifyMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Current Power",
                  "type": "stat",
                  "targets": [
                    { "expr": "sum(sun2000_real_time_power_kw)", "legendFormat": "Power", "refId": "A" }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [{ "color": "blue", "value": null }, { "color": "green", "value": 0 }]
                      },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 4, "x": 4, "y": 0 },
                  "id": 2,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "area",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Today",
                  "type": "stat",
                  "targets": [
                    { "expr": "sum(sun2000_daily_energy_kwh)", "legendFormat": "Daily", "refId": "A" }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "unit": "kwatth",
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [{ "color": "blue", "value": null }, { "color": "green", "value": 0 }]
                      },
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 4, "x": 8, "y": 0 },
                  "id": 3,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "area",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "This Month",
                  "type": "stat",
                  "targets": [
                    { "expr": "sum(sun2000_month_energy_kwh)", "legendFormat": "Monthly", "refId": "A" }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "unit": "kwatth",
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [{ "color": "purple", "value": null }, { "color": "green", "value": 0 }]
                      },
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 4, "x": 12, "y": 0 },
                  "id": 4,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "area",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "This Year",
                  "type": "stat",
                  "targets": [
                    { "expr": "sum(sun2000_year_energy_kwh)", "legendFormat": "Yearly", "refId": "A" }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "unit": "kwatth",
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [{ "color": "dark-blue", "value": null }, { "color": "green", "value": 0 }]
                      },
                      "min": 0,
                      "decimals": 0
                    }
                  },
                  "gridPos": { "h": 6, "w": 4, "x": 16, "y": 0 },
                  "id": 6,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Total Lifetime",
                  "type": "stat",
                  "targets": [
                    { "expr": "sum(sun2000_cumulative_energy_kwh)", "legendFormat": "Lifetime", "refId": "A" }
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
                        { "options": { "0": { "text": "FAILED" }, "1": { "text": "OK" } }, "type": "value" }
                      ]
                    }
                  },
                  "gridPos": { "h": 3, "w": 4, "x": 20, "y": 0 },
                  "id": 7,
                  "options": {
                    "colorMode": "background",
                    "graphMode": "none",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Scrape Status",
                  "type": "stat",
                  "targets": [
                    { "expr": "sum(sun2000_scrape_success)", "refId": "A" }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "unit": "dateTimeAsIso",
                      "color": { "mode": "fixed", "fixedColor": "text" },
                      "decimals": 0
                    }
                  },
                  "gridPos": { "h": 3, "w": 4, "x": 20, "y": 3 },
                  "id": 10,
                  "options": {
                    "colorMode": "value",
                    "graphMode": "none",
                    "justifyMode": "center",
                    "textMode": "auto",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false }
                  },
                  "title": "Last Update",
                  "type": "stat",
                  "targets": [
                    { "expr": "sum(sun2000_last_scrape_timestamp) * 1000", "refId": "A" }
                  ]
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "custom": {
                        "drawStyle": "line",
                        "fillOpacity": 30,
                        "lineInterpolation": "smooth",
                        "lineWidth": 2,
                        "pointSize": 5,
                        "showPoints": "never",
                        "spanNulls": false,
                        "stacking": { "group": "A", "mode": "none" },
                        "axisPlacement": "auto"
                      },
                      "color": { "mode": "palette-classic" },
                      "unit": "kwatt",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 8, "w": 24, "x": 0, "y": 6 },
                  "id": 5,
                  "title": "Power Output Over Time",
                  "type": "timeseries",
                  "targets": [
                    {
                      "expr": "sum(sun2000_real_time_power_kw)",
                      "legendFormat": "Current Power",
                      "refId": "A"
                    }
                  ],
                  "options": {
                    "legend": { "calcs": ["mean", "max", "min"], "displayMode": "table", "placement": "bottom" },
                    "tooltip": { "mode": "single", "sort": "none" }
                  }
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "custom": {
                        "drawStyle": "bars",
                        "fillOpacity": 80,
                        "lineWidth": 0,
                        "pointSize": 5,
                        "showPoints": "never",
                        "spanNulls": false,
                        "stacking": { "group": "A", "mode": "none" },
                        "axisPlacement": "auto"
                      },
                      "color": { "mode": "palette-classic" },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 8, "w": 12, "x": 0, "y": 14 },
                  "id": 8,
                  "title": "Daily Energy Production (Last 30 Days)",
                  "type": "timeseries",
                  "targets": [
                    {
                      "expr": "sum(increase(sun2000_daily_energy_kwh[1d]))",
                      "legendFormat": "Daily Energy",
                      "refId": "A",
                      "interval": "1d"
                    }
                  ],
                  "options": {
                    "legend": { "calcs": ["mean", "max", "min", "last"], "displayMode": "table", "placement": "bottom" },
                    "tooltip": { "mode": "single", "sort": "none" }
                  }
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "custom": {
                        "drawStyle": "bars",
                        "fillOpacity": 90,
                        "lineWidth": 0,
                        "pointSize": 5,
                        "showPoints": "never",
                        "spanNulls": false,
                        "stacking": { "group": "A", "mode": "none" },
                        "axisPlacement": "auto",
                        "barAlignment": 0
                      },
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "blue", "value": null },
                          { "color": "green", "value": 100 },
                          { "color": "yellow", "value": 300 }
                        ]
                      },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 8, "w": 12, "x": 12, "y": 14 },
                  "id": 15,
                  "title": "Monthly Energy Production (Last 12 Months)",
                  "type": "timeseries",
                  "targets": [
                    {
                      "expr": "sum(increase(sun2000_month_energy_kwh[30d]))",
                      "legendFormat": "Monthly Energy",
                      "refId": "A",
                      "interval": "30d"
                    }
                  ],
                  "options": {
                    "legend": { "calcs": ["mean", "max", "min", "last"], "displayMode": "table", "placement": "bottom" },
                    "tooltip": { "mode": "single", "sort": "none" }
                  }
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "custom": {
                        "drawStyle": "line",
                        "fillOpacity": 20,
                        "lineInterpolation": "smooth",
                        "lineWidth": 2,
                        "pointSize": 5,
                        "showPoints": "never",
                        "spanNulls": false,
                        "stacking": { "group": "A", "mode": "none" },
                        "axisPlacement": "auto"
                      },
                      "color": { "mode": "continuous-GrYlRd" },
                      "unit": "kwatth",
                      "min": 0
                    }
                  },
                  "gridPos": { "h": 8, "w": 24, "x": 0, "y": 22 },
                  "id": 9,
                  "title": "Cumulative Energy Growth",
                  "type": "timeseries",
                  "targets": [
                    {
                      "expr": "sum(sun2000_cumulative_energy_kwh)",
                      "legendFormat": "Total Lifetime Production",
                      "refId": "A"
                    }
                  ],
                  "options": {
                    "legend": { "calcs": ["last", "delta"], "displayMode": "table", "placement": "bottom" },
                    "tooltip": { "mode": "single", "sort": "none" }
                  }
                },
                {
                  "datasource": { "type": "prometheus", "uid": "$${datasource}" },
                  "fieldConfig": {
                    "defaults": {
                      "color": { "mode": "thresholds" },
                      "thresholds": {
                        "steps": [
                          { "color": "green", "value": null },
                          { "color": "yellow", "value": 3 },
                          { "color": "red", "value": 5 }
                        ]
                      },
                      "unit": "kwatt",
                      "decimals": 2
                    }
                  },
                  "gridPos": { "h": 4, "w": 6, "x": 0, "y": 30 },
                  "id": 11,
                  "options": {
                    "colorMode": "value",
                    "graphMode": "area",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["mean"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Average Power (24h)",
                  "type": "stat",
                  "targets": [
                    { "expr": "avg_over_time(sum(sun2000_real_time_power_kw)[24h:])", "refId": "A" }
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
                          { "color": "green", "value": 5 },
                          { "color": "yellow", "value": 10 }
                        ]
                      },
                      "unit": "kwatt",
                      "decimals": 2
                    }
                  },
                  "gridPos": { "h": 4, "w": 6, "x": 6, "y": 30 },
                  "id": 12,
                  "options": {
                    "colorMode": "value",
                    "graphMode": "area",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["max"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Peak Power (24h)",
                  "type": "stat",
                  "targets": [
                    { "expr": "max_over_time(sum(sun2000_real_time_power_kw)[24h:])", "refId": "A" }
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
                          { "color": "green", "value": 0 }
                        ]
                      },
                      "unit": "kwatth",
                      "decimals": 1
                    }
                  },
                  "gridPos": { "h": 4, "w": 6, "x": 12, "y": 30 },
                  "id": 13,
                  "options": {
                    "colorMode": "value",
                    "graphMode": "area",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["mean"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Avg Daily Production (30d)",
                  "type": "stat",
                  "targets": [
                    { "expr": "avg_over_time(sum(sun2000_daily_energy_kwh)[30d:])", "refId": "A" }
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
                          { "color": "green", "value": 0 }
                        ]
                      },
                      "unit": "kwatth",
                      "decimals": 1
                    }
                  },
                  "gridPos": { "h": 4, "w": 6, "x": 18, "y": 30 },
                  "id": 14,
                  "options": {
                    "colorMode": "value",
                    "graphMode": "area",
                    "orientation": "auto",
                    "reduceOptions": { "calcs": ["last"], "fields": "", "values": false },
                    "textMode": "auto"
                  },
                  "title": "Yesterday's Production",
                  "type": "stat",
                  "targets": [
                    {
                      "expr": "max_over_time(sum(sun2000_daily_energy_kwh)[1d:] offset 1d)",
                      "refId": "A"
                    }
                  ]
                }
              ],
              "refresh": "30s",
              "schemaVersion": 39,
              "templating": {
                "list": [
                  {
                    "name": "datasource",
                    "query": "prometheus",
                    "refresh": 1,
                    "type": "datasource"
                  }
                ]
              },
              "time": { "from": "now-24h", "to": "now" },
              "title": "Sun2000 Solar Inverter",
              "uid": "sun2000-solar",
              "version": 3
            }
    EOT
  ]

  count = var.sun2000_enabled ? 1 : 0

  depends_on = [helm_release.kube_prometheus_stack]
}
