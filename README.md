# inference-bros

## Requirements
- 1 or more Debian Linux servers with root access (via SSH too!) and gpu drivers installed, if any.
- Public SSH key added to trusted keys
- All servers in the same LAN with static IPs configured each.
- At least 2 free IP addresses on the LAN subnet (one for kube_vip and one for MetalLB - NGINX)
- Public IP address in LAN router. Ports for SSH (2201, 2202, 2203, etc to each server IP port 22) , 80/443 (to NGINX MetalLB service IP) and 6443 (to kube_vip) to be forwarded.
- Domain and DNS management
- A type record for domain.com and *.domain.com (or with CNAMES) to point to public IP.

## GPU Installation

# Nvidia on Debian
- nano /etc/apt/sources.list:
```
deb http://deb.debian.org/debian/ trixie main non-free-firmware non-free contrib
deb-src http://deb.debian.org/debian/ trixie main non-free-firmware non-free contrib

deb http://deb.debian.org/debian/ trixie-updates main non-free-firmware non-free contrib
deb-src http://deb.debian.org/debian/ trixie-updates main non-free-firmware non-free contrib

deb http://deb.debian.org/debian-security trixie-security main non-free-firmware non-free contrib
deb-src http://deb.debian.org/debian-security trixie-security main non-free-firmware non-free contrib
```
- Install driver
```
apt-get update
apt-get install -y gpg curl wget
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
apt-get update
apt install linux-headers-$(uname -r) build-essential
apt install nvidia-driver firmware-misc-nonfree nvidia-smi nvidia-container-runtime

wget https://developer.download.nvidia.com/compute/cuda/12.9.0/local_installers/cuda_12.9.0_575.51.03_linux.run
sh cuda_12.9.0_575.51.03_linux.run --toolkit --silent --override

reboot
```
- Check
```
nvidia-smi
```

## Local dev
Google Drive link: https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN?usp=share_link   
- Install VirtualBox + Extension Pack
- Download terraform.tfvars from Google Drive and add it to the root of this repo.
- Download root-ca.crt and root-ca.key from Google Drive/Certificates and add to dev machine trust store.
- Download ssh key from Google Drive/SSH Keys and add them into .ssh folder.
- Download OVA file from Google Drive and import.
- User root password root. SSH working only with keys. Pubkey already included.
- Boot it, run ifconfig and take note of the IP. Add the IP to the terraform input file in the servers section.
- Add another IP for kube_vip in terraform.tfvars, any free IP on your network.
- Set metallb_range to a free range of IPs in your LAN
- Edit your hosts file on dev machine AND VM!!! and add: k3s.local.inferencebros.com -> k3s vip, models/control/alertmanager/prometheus/bifrost/bifrost-insecure/longhorn/dex/oauth2-proxy/grafana/etc .local.inferencebros.com -> nginx metallb ip.

```
192.168.1.252 k3s.local.inferencebros.com
192.168.1.240 dex.local.inferencebros.com
192.168.1.240 oauth2-proxy.local.inferencebros.com
192.168.1.240 headlamp.local.inferencebros.com
192.168.1.240 grafana.local.inferencebros.com
192.168.1.240 alertmanager.local.inferencebros.com
192.168.1.240 prometheus.local.inferencebros.com
192.168.1.240 longhorn.local.inferencebros.com
192.168.1.240 control.local.inferencebros.com
192.168.1.240 models.local.inferencebros.com
192.168.1.240 bifrost.local.inferencebros.com
192.168.1.240 bifrost-insecure.local.inferencebros.com # dev purposes
```

- Run terraform plan and apply
- To get kubeconfig run after apply: terraform output k3s_kubeconfig_for_users


## Sample model

```
apiVersion: kubeai.org/v1
kind: Model
metadata:
  annotations:
    openrouter.ai/json: |
      {
        "id": "llama",
        "hugging_face_id": "llama",
        "name": "Llama",
        "created": 1690502400,
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "quantization": "bf16",
        "context_length": 4096,
        "max_output_length": 8000,
        "pricing": {
          "prompt": "0.000008",
          "completion": "0.000024",
          "image": "0",
          "request": "0",
          "input_cache_read": "0",
          "input_cache_write": "0"
        },
        "supported_sampling_parameters": ["temperature", "stop"],
        "supported_features": [
          "tools",
          "json_mode",
          "structured_outputs",
          "web_search"
        ],
        "description": "Llama",
        "openrouter": {
          "slug": "inferencebros-stalpeni/llama"
        },
        "datacenters": [
          {
            "country_code": "RO"
          }
        ]
      }
  name: llama
  namespace: kubeai
spec:
  engine: VLLM
  features:
  - TextGeneration
  image: vllm/vllm-openai:v0.8.5
  minReplicas: 1
  replicas: 1
  resourceProfile: nvidia:1
  url: hf://unsloth/Llama-3.2-1B-Instruct
  args:
    - --dtype=half # 1050 is small
```




# Accounts and Services
Google Drive - secret files - https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN  
TerraForm Cloud - state files for infra - https://app.terraform.io/app/inference-bros/workspaces  
CloudFlare - DNS management for inferencebros.com - https://dash.cloudflare.com/f159b7db29dec75259ced7d4ad1c4a18/inferencebros.com/dns/records  
Domain management - TODO
Slack - comms and alerts - https://inferencebros.slack.com/ 
Invoicing - Odoo - https://inferencebros.odoo.com/odoo   


K3S - https://k3s.locationName.inferencebros.com:6443  
See repo readme for kubeconfig.  

All hosted services in k3s are using Dex IdP. You all have your own IdP credentials.  
URLs: serviceName.locationName.inferencebros.com  
  
Example for local:  
https://grafana.local.inferencebros.com

Examples for Stalpeni:  
https://grafana.stalpeni.inferencebros.com - monitoring and alerting software  
https://headlamp.stalpeni.inferencebros.com - k3s management  
https://longhorn.stalpeni.inferencebros.com - PVC management  
https://prometheus.stalpeni.inferencebros.com  
https://alertmanager.stalpeni.inferencebros.com  
https://bifrost.stalpeni.inferencebros.com  - LLM gateway  
https://models.stalpeni.inferencebros.com  - PVC explorer for models  
https://control.stalpeni.inferencebros.com  - control software 


Installed software on k3s:  
- GPU operators  
- MetalLB - LoadBalancer type services
- Kube-VIP - K3S master HA
- longhorn - CSI persistent volumes manager
- ingress-nginx - entrypoint
- cert-manager + letsencrypt issuer + self signed issuer - SSL certs
- dex IdP - internal identity provider
- kube-prometheus-stack: prometheus operator, prometheus, alertmanager - metrics, alerting  
- loki - log store  
- fluent-bit - log reader daemon  
- grafana - nice ui for logging, monitoring and alerting  
- headlamp - k8s management dashboard  
- oauth2-proxy - shared instance to protect open UIs like longhorn, bifrost    
- KubeAI - vLLM runner  
- Bifrost - LLM Gateway  
- PVC Explorer for Models  
- Custom scripts  
