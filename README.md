# inference-bros

## Requirements
- 1 or more Alpine Linux servers with root access
- Public SSH key added to trusted keys
- All servers in the same LAN with static IPs configured each.
- At least 2 free IP addresses on the LAN subnet (one for kube_vip and one for MetalLB - NGINX)
- Public IP address in LAN router. Ports for SSH (2201, 2202, 2203, etc to each server IP port 22) , 80/443 (to NGINX MetalLB service IP) and 6443 (to kube_vip) to be forwarded.
- Domain and (Dynamic) DNS management
- A record for domain.com and *.domain.com (or with CNAMES) to point to public IP.


## Local dev
Google Drive link: https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN?usp=share_link   
- Install VirtualBox + Extension Pack
- Download terraform.tfvars from Google Drive and add it to the root of this repo.
- Download OVA file from Google Drive and import.
- User root password root. SSH working only with keys. Pubkey already included.
- Boot it
- Run terraform plan and apply