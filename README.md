# inference-bros

## Requirements:
- Domain pointed to CloudFlare
- Linux nodes amd64/arm64 with GPU, systemd, iptables/nftables, public key authentication
- Public IP, router. Ports 6443, 80, 443 forwarded. 6443 -> k3s masters, 80,443 -> any k3s node
- K3S installed with vxlan flannel backend and OIDC auth. Disable: servicelb, traefik, local-storage

In K3S:  
- GPU support
- MetalLB for LAN LB VIPs
- cert-manager + letsencrypt clusterissuer
- external-dns with CloudFlare config
- ingress-nginx
- Longhorn
- Dex IdP with sqlite storage with configured apps and users - Grafana, K3S
- kube-prometheus-stack (Grafana disabled)
- Grafana Loki
- Grafana Tempo
- Create /var/lib/rancher/k3s/server/manifests/traefik-custom.yaml Helm Values to add telemetry to Tempo
- Promtail configured for Loki
- Grafana + loki/prom/cert-manager/external-dns/nginx/kserve dashboards
- velero + vui (backup to remote s3 location)
- kserve
- system-upgrade-controller
- headlamp
- helm-dashboard