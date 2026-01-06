resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  namespace  = "ingress-nginx"
  create_namespace = true
  version = "4.14.1"
  atomic          = true
  wait            = true

  values = [
    <<-EOT
      controller:
        service:
          loadBalancerIP: "${var.nginx_metallb_ip}"
        metrics:
          enabled: true
          serviceMonitor:
            enabled: true
    EOT

  ]

  depends_on = [helm_release.metallb_config]
}