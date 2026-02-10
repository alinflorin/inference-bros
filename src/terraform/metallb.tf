resource "helm_release" "metallb" {
  name             = "metallb"
  repository       = "https://metallb.github.io/metallb"
  chart            = "metallb"
  namespace        = "metallb-system"
  create_namespace = true
  version          = "0.15.3"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      prometheus:
        rbacPrometheus: false
        serviceMonitor:
          enabled: true
      controller:
        resources:
          requests:
            cpu: 50m
            memory: 30Mi
          limits:
            cpu: 100m
            memory: 90Mi
      speaker:
        resources:
          requests:
            cpu: 50m
            memory: 30Mi
          limits:
            cpu: 100m
            memory: 90Mi
        frr:
          enabled: false
          resources:
            requests:
              cpu: 50m
              memory: 30Mi
            limits:
              cpu: 100m
              memory: 90Mi
        reloader:
          resources:
            requests:
              cpu: 50m
              memory: 30Mi
            limits:
              cpu: 100m
              memory: 90Mi
        frrMetrics:
          resources:
            requests:
              cpu: 50m
              memory: 30Mi
            limits:
              cpu: 100m
              memory: 90Mi
        initContainers:
          cpFrrFiles:
            resources:
              requests:
                cpu: 50m
                memory: 30Mi
              limits:
                cpu: 100m
                memory: 90Mi
          cpReloader:
            resources:
              requests:
                cpu: 50m
                memory: 30Mi
              limits:
                cpu: 100m
                memory: 90Mi
          cpMetrics:
            resources:
              requests:
                cpu: 50m
                memory: 30Mi
              limits:
                cpu: 100m
                memory: 90Mi
    EOT

  ]

  depends_on = [helm_release.prometheus_operator_crds]
}

resource "helm_release" "metallb_config" {
  name             = "metallb-config"
  repository       = "https://georgelucker.github.io/fx-reg/"
  chart            = "MetalLB-address-pool"
  namespace        = "metallb-system"
  create_namespace = true
  version          = "0.1.2"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      ipAddressPool:
        name: default-pool
        namespace: metallb-system
        address: ${var.metallb_range}
        autoAssign: true

      l2Advertisement:
        name: l2-addr
        namespace: metallb-system
        ipAddressPool: default-pool
    EOT

  ]

  depends_on = [helm_release.metallb]
}
