write-kubeconfig-mode: "0644"
node-ip: ${ip}
flannel-iface: ${iface}
node-name: ${hostname}
tls-san:
  - ${ip}
  - ${vip}
  - ${domain}
disable:
  - servicelb
  - traefik
  - local-storage
cluster-init: true