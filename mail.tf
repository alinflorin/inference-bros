resource "helm_release" "mail" {
  name             = "mail"
  repository       = "https://bokysan.github.io/docker-postfix/"
  chart            = "mail"
  namespace        = "mail"
  create_namespace = true
  version          = "5.1.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
config:
  general:
    ALLOWED_SENDER_DOMAINS: ${var.smtp_allowed_domain}
    RELAYHOST: ${var.smtp_host}
    RELAYHOST_PASSWORD: ${var.smtp_password}
    RELAYHOST_USERNAME: ${var.smtp_username}
  postfix:
    smtp_tls_security_level: none
    EOT
  ]

  depends_on = [helm_release.longhorn[0]]
}