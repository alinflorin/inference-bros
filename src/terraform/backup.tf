resource "helm_release" "snapshot_controller" {
  name             = "snapshot-controller"
  repository       = "https://piraeus.io/helm-charts/"
  chart            = "snapshot-controller"
  namespace        = "kube-system"
  create_namespace = true
  version          = "5.0.2"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      controller:
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 100m
            memory: 128Mi
    EOT
    ,
    var.longhorn_enabled ?
    <<-EOT
      volumeSnapshotClasses:
        - name: longhorn-snapshot-vsc
          annotations:
            snapshot.storage.kubernetes.io/is-default-class: "true"
          labels:
            velero.io/csi-volumesnapshot-class: "true"
          driver: driver.longhorn.io
          deletionPolicy: Delete
          parameters:
            type: bak
    EOT
    : ""
  ]

  count = var.enable_backup ? 1 : 0

  depends_on = [helm_release.longhorn[0]]
}


resource "helm_release" "longhorn_backup_secret" {
  name             = "longhorn-backup-secret"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "longhorn-system"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: v1
        kind: Secret
        metadata:
          name: s3-secret
          namespace: longhorn-system
        type: Opaque
        stringData:
          AWS_ACCESS_KEY_ID: ${var.s3_key_id}
          AWS_SECRET_ACCESS_KEY: ${var.s3_key_secret}
          AWS_ENDPOINTS: ${var.s3_url}
    EOT

  ]
  count      = var.enable_backup && var.longhorn_enabled ? 1 : 0
  depends_on = [helm_release.snapshot_controller[0]]
}



resource "helm_release" "velero" {
  name             = "velero"
  repository       = "https://vmware-tanzu.github.io/helm-charts/"
  chart            = "velero"
  namespace        = "velero"
  create_namespace = true
  version          = "11.3.2"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      metrics:
        serviceMonitor:
          enabled: true
      resources: 
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 200m
          memory: 256Mi
      nodeAgent:
        resources: 
          requests:
            cpu: 50m
            memory: 128Mi
          limits:
            cpu: 150m
            memory: 256Mi
      initContainers:
        - name: velero-plugin-for-aws
          image: velero/velero-plugin-for-aws:v1.13.1
          imagePullPolicy: IfNotPresent
          volumeMounts:
            - mountPath: /target
              name: plugins
      snapshotsEnabled: true
      deployNodeAgent: ${var.longhorn_enabled ? "false" : "true"}
      credentials:
        secretContents:
          cloud: |
            [default]
            aws_access_key_id=${var.s3_key_id}
            aws_secret_access_key=${var.s3_key_secret}
      configuration:
        ${var.longhorn_enabled ? "features: EnableCSI" : ""}
        backupStorageLocation:
          - name: default
            provider: aws
            bucket: velero${var.location}
            config:
              region: global
              s3ForcePathStyle: true
              s3Url: ${var.s3_url}
              publicUrl: ${var.s3_url}
        volumeSnapshotLocation:
          - name: default
            provider: aws
            config:
              region: global
    EOT
  ]

  count = var.enable_backup ? 1 : 0

  depends_on = [helm_release.snapshot_controller[0]]
}


resource "helm_release" "vui" {
  name             = "vui"
  repository       = "https://seriohub.github.io/velero-helm"
  chart            = "vui"
  namespace        = "velero"
  create_namespace = true
  version          = "1.0.6"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      global:
        clusterName: k3s-${var.location}
      apiService:
        deployment:
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 100m
              memory: 256Mi
      uiService:
        deployment:
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 100m
              memory: 256Mi
      watchdogService:
        deployment:
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 100m
              memory: 256Mi
      auth:
        enabled: false
      exposure:
        mode: ingress
        ingress:
          ingressClassName: nginx
          metadata:
            annotations:
              cert-manager.io/cluster-issuer: ${var.location == "local" ? "root-ca-issuer" : "letsencrypt"}
              nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy.oauth2-proxy.svc.cluster.local/oauth2/auth"
              nginx.ingress.kubernetes.io/auth-signin: "https://oauth2-proxy.${var.domain}/oauth2/start?rd=$scheme://$host$request_uri"
              nginx.ingress.kubernetes.io/proxy-buffering: "off"
              nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
              nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
              nginx.ingress.kubernetes.io/proxy-body-size: "128m"
              nginx.ingress.kubernetes.io/proxy-connect-timeout: "3600"
              nginx.ingress.kubernetes.io/ssl-redirect: 'true'
          spec:
            tls:
              - hosts:
                  - vui.${var.domain}
                secretName: vui-tls

    EOT
  ]

  count = var.enable_backup ? 1 : 0

  depends_on = [helm_release.velero[0]]
}


resource "helm_release" "velero_backup_schedule" {
  name             = "velero-backup-schedule"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "velero"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: velero.io/v1
        kind: Schedule
        metadata:
          name: regular
          namespace: velero
        spec:
          schedule: 0 2 * * *
          template:
            ${var.longhorn_enabled ? "" : "defaultVolumesToFsBackup: true"}
            excludedNamespaces:
            - monitoring
            includedNamespaces:
            - "*"
            storageLocation: default
            ttl: 72h0m0s
    EOT

  ]
  count      = var.enable_backup ? 1 : 0
  depends_on = [helm_release.velero[0]]
}