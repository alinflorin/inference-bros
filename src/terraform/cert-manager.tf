resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "1.19.2"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      crds:
        enabled: true
      prometheus:
        servicemonitor:
          enabled: true
      resources:
        requests:
          cpu: 10m
          memory: 50Mi
        limits:
          cpu: 20m
          memory: 100Mi
      webhook:
        resources:
          requests:
            cpu: 10m
            memory: 32Mi
          limits:
            cpu: 20m
            memory: 50Mi
      cainjector:
        resources:
          requests:
            cpu: 10m
            memory: 60Mi
          limits:
            cpu: 20m
            memory: 100Mi
    EOT
  ]

  depends_on = [helm_release.prometheus_operator_crds]
}

resource "helm_release" "cert_manager_issuer" {
  name             = "cert-manager-issuer"
  repository       = "https://radar-base.github.io/radar-helm-charts"
  chart            = "cert-manager-letsencrypt"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "0.2.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      nameOverride: letsencrypt
      fullnameOverride: letsencrypt
      namespaceOverride: "cert-manager"
      maintainerEmail: ${var.letsencrypt_email}
      httpIssuer:
        enabled: true
        environment: production
        privateSecretRef: letsencrypt
        ingressMatchMethod: class
        ingressMatchValue: nginx

    EOT

  ]

  depends_on = [helm_release.cert_manager]
}

resource "helm_release" "cert_manager_self_signed_issuer" {
  name             = "cert-manager-self-signed-issuer"
  repository       = "https://dasmeta.github.io/helm/"
  chart            = "resource"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "0.1.1"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      resource:
        apiVersion: cert-manager.io/v1
        kind: ClusterIssuer
        metadata:
          name: root-ca-issuer
        spec:
          ca:
            secretName: root-ca
    EOT

  ]

  depends_on = [helm_release.cert_manager]
}
