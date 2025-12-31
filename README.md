# inference-bros

## Requirements:
- Domain pointed to CloudFlare
- Linux nodes amd64/arm64 with GPU, systemd, iptables/nftables, public key authentication
- Netbird client installed
- Public IP, router. Ports 6443, 80, 443 forwarded. 6443 -> k3s masters, 80,443 -> any server
- K3S installed with host-gw flannel backend and OIDC auth. Disable: local-storage
- Netbird configured for K3S routes for Pods and Services, for each server.

In K3S:  
- GPU support
- cert-manager + letsencrypt clusterissuer
- external-dns with CloudFlare config
- Longhorn
- Dex IdP with sqlite storage with configured apps and users - Grafana, K3S
- kube-prometheus-stack (Grafana disabled)
- Grafana Loki
- Grafana Tempo
- Create /var/lib/rancher/k3s/server/manifests/traefik-custom.yaml Helm Values to add telemetry to Tempo
- Promtail configured for Loki
- Grafana + loki/prom/cert-manager/external-dns/traefik/longhorn/kserve dashboards
- velero + vui (backup to remote s3 location)
- kserve
- system-upgrade-controller
- headlamp
- helm-dashboard