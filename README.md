# inference-bros

## Requirements
- 1 or more Alpine Linux servers with root access and gpu drivers installed, if any
- Public SSH key added to trusted keys
- All servers in the same LAN with static IPs configured each.
- At least 2 free IP addresses on the LAN subnet (one for kube_vip and one for MetalLB - NGINX)
- Public IP address in LAN router. Ports for SSH (2201, 2202, 2203, etc to each server IP port 22) , 80/443 (to NGINX MetalLB service IP) and 6443 (to kube_vip) to be forwarded.
- Domain and DNS management
- A type record for domain.com and *.domain.com (or with CNAMES) to point to public IP.


## Local dev
Google Drive link: https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN?usp=share_link   
- Install VirtualBox + Extension Pack
- Download terraform.tfvars from Google Drive and add it to the root of this repo.
- Download root-ca.crt and root-ca.key from Google Drive/Certificates and add to dev machine trust store.
- Download OVA file from Google Drive and import.
- User root password root. SSH working only with keys. Pubkey already included.
- Boot it, run ifconfig and take note of the IP. Add the IP to the terraform input file in the servers section.
- Add another IP for kube_vip in terraform.tfvars, any free IP on your network.
- Set metallb_range to a free range of IPs in your LAN
- Edit your hosts file on dev machine AND VM!!! and add: k3s.local.inferencebros.com -> k3s vip, kubeai/longhorn/dex/oauth2-proxy/grafana/etc .local.inferencebros.com -> nginx metallb ip.

```
192.168.1.252 k3s.local.inferencebros.com
192.168.1.240 dex.local.inferencebros.com
192.168.1.240 oauth2-proxy.local.inferencebros.com
192.168.1.240 headlamp.local.inferencebros.com
192.168.1.240 grafana.local.inferencebros.com
192.168.1.240 longhorn.local.inferencebros.com
192.168.1.240 kubeai.local.inferencebros.com
```

- Run terraform plan and apply
- To get kubeconfig run after apply: terraform output k3s_kubeconfig_for_users