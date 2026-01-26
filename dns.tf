resource "cloudflare_dns_record" "wildcard" {
  zone_id = var.cloudflare_zone_id
  name = "k3s.${var.location}"
  type = "A"
  content = var.public_ip
  ttl = 300
  proxied = false

  count = var.enable_dns ? 1 : 0
}