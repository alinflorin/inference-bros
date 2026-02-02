# inference-bros

A Kubernetes-based platform for selling AI inference services. This infrastructure runs on bare-metal servers and deploys language models that customers can access via API.

## What This Does

This platform allows you to:
- Deploy and serve AI language models (like Qwen, Llama, etc.)
- Manage customer access and billing through Bifrost gateway
- Monitor usage and generate invoices automatically
- Provide OpenAI-compatible API endpoints

## Quick Links

**Services & Tools:**
- Google Drive (secret files): https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN
- Terraform Cloud (infrastructure state): https://app.terraform.io/app/inference-bros/workspaces
- CloudFlare (DNS): https://dash.cloudflare.com/f159b7db29dec75259ced7d4ad1c4a18/inferencebros.com
- Slack (alerts): https://inferencebros.slack.com/
- Odoo (invoicing): https://inferencebros.odoo.com/odoo

**Live Deployments:**
All services use pattern: `https://{service}.{location}.inferencebros.com`

Example for Stalpeni location:
- `grafana.stalpeni.inferencebros.com` - Monitoring & dashboards
- `headlamp.stalpeni.inferencebros.com` - Kubernetes management
- `bifrost.stalpeni.inferencebros.com` - LLM gateway & customer management
- `models.stalpeni.inferencebros.com` - Model storage browser
- `control.stalpeni.inferencebros.com` - Invoicing & usage API

## Production Hardware Requirements

- 1 or more Debian Linux servers with:
  - Root SSH access
  - GPU drivers installed (if using GPUs)
  - Static IPs configured on same LAN
- At least 2 free IPs on your LAN subnet:
  - **kube_vip IP** - Virtual IP for high-availability Kubernetes API (e.g., 192.168.1.252)
  - **MetalLB NGINX IP** - LoadBalancer IP for all web services (e.g., 192.168.1.240)
- Public IP with port forwarding for:
  - SSH (2201, 2202, etc. → server port 22)
  - HTTPS (443 → MetalLB NGINX IP)
  - K3s API (6443 → kube_vip IP)
- Domain name with DNS management

**IP Explanation:**
- **Server IPs** - Each physical server's static IP on your LAN
- **kube_vip** - Floats between master nodes for K3s API redundancy
- **MetalLB NGINX** - Single IP where all ingress traffic lands (Grafana, Bifrost, etc.)

## Development Setup

### 1. Prepare Secret Files
Download from Google Drive:
- `terraform.tfvars` - Add to repo root
- `root-ca.crt` and `root-ca.key` - Add to local trust store
- SSH keys - Add to `~/.ssh/`

### 2. Configure Local Development
- Install VirtualBox + Extension Pack
- Download and import OVA file from Google Drive
- Boot VM, note its IP address
- Update `terraform.tfvars` with VM IP and network settings
- Edit `/etc/hosts` on both dev machine AND VM:

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
```

### 3. Deploy Infrastructure
```bash
cd src/terraform
terraform plan
terraform apply
```

### 4. Get Cluster Access
```bash
terraform output k3s_kubeconfig_for_users
```

## Deploying Models

Use Headlamp dashboard to create Model resources. All models need the `openrouter.ai/json` annotation for API discovery and pricing.

**Available Resource Profiles:**
- `nvidia-unlimited` - Modern NVIDIA GPUs
- `nvidia-older-unlimited` - Pascal architecture GPUs
- `cpu-unlimited` - Generic CPU
- `cpu-avx2-unlimited` - CPUs with AVX2 support

**Model Runners:**
- VLLM - Recommended for production (supports model caching)
- Ollama - Alternative runner

### Example Models

**1. VLLM on NVIDIA GPU (older cards like 1050Ti):**
```yaml
apiVersion: kubeai.org/v1
kind: Model
metadata:
  annotations:
    openrouter.ai/json: |
      {
        "id": "qwen-gpu-vllm",
        "name": "qwen-gpu-vllm",
        "pricing": {
          "prompt": "0.000008",
          "completion": "0.000024"
        }
      }
  name: qwen-gpu-vllm
  namespace: kubeai
spec:
  engine: VLLM
  args:
    - --gpu-memory-utilization=0.9
    - --dtype=half
    - --max-model-len=1024
  features:
    - TextGeneration
  minReplicas: 1
  replicas: 1
  resourceProfile: nvidia-older-unlimited:1
  url: hf://Qwen/Qwen2.5-0.5B-Instruct
  cacheProfile: storage
```

**2. VLLM on CPU (AVX2 support):**
```yaml
apiVersion: kubeai.org/v1
kind: Model
metadata:
  annotations:
    openrouter.ai/json: |
      {
        "id": "qwen-cpu-vllm",
        "name": "qwen-cpu-vllm",
        "pricing": {
          "prompt": "0.000008",
          "completion": "0.000024"
        }
      }
  name: qwen-cpu-vllm
  namespace: kubeai
spec:
  engine: VLLM
  features:
    - TextGeneration
  minReplicas: 1
  replicas: 1
  resourceProfile: cpu-avx2-unlimited:1
  url: hf://Qwen/Qwen2.5-0.5B-Instruct
  cacheProfile: storage
```

**3. Ollama on NVIDIA GPU:**
```yaml
apiVersion: kubeai.org/v1
kind: Model
metadata:
  annotations:
    openrouter.ai/json: |
      {
        "id": "qwen-gpu-ollama",
        "name": "qwen-gpu-ollama",
        "pricing": {
          "prompt": "0.000008",
          "completion": "0.000024"
        }
      }
  name: qwen-gpu-ollama
  namespace: kubeai
spec:
  engine: OLlama
  features:
    - TextGeneration
  minReplicas: 1
  replicas: 1
  resourceProfile: nvidia-unlimited:1
  url: ollama://hf.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF:qwen2.5-0.5b-instruct-q4_k_m.gguf
```

**4. Ollama on CPU:**
```yaml
apiVersion: kubeai.org/v1
kind: Model
metadata:
  annotations:
    openrouter.ai/json: |
      {
        "id": "qwen-cpu-ollama",
        "name": "qwen-cpu-ollama",
        "pricing": {
          "prompt": "0.000008",
          "completion": "0.000024"
        }
      }
  name: qwen-cpu-ollama
  namespace: kubeai
spec:
  engine: OLlama
  features:
    - TextGeneration
  minReplicas: 1
  replicas: 1
  resourceProfile: cpu-unlimited:1
  url: ollama://hf.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF:qwen2.5-0.5b-instruct-q4_k_m.gguf
```

**Notes:**
- Model caching (`cacheProfile: storage`) is only supported on VLLM
- Only use `cacheProfile` if Longhorn is installed
- Full openrouter.ai/json schema available in original README

## Customer Management

### Adding Customers
1. Go to Bifrost: `https://bifrost.{location}.inferencebros.com`
2. Governance > Users & Groups > Customers - Add customer
3. Governance > Virtual Keys - Create key for customer
4. Share key with customer

### Testing with Cherry Studio
1. Install Cherry Studio: https://www.cherry-ai.com/download
2. Settings > Model Provider
3. Add OpenAI provider with:
   - URL: `https://bifrost.{location}.inferencebros.com`
   - API Key: (from Bifrost)
4. Manage models and start chatting

## Monitoring & Operations

**Key Endpoints:**
- `control.{location}.inferencebros.com` - Control service
  - `/openrouter/models` - Available models (public)
  - `/bifrost/pricingSheet` - Current pricing (public)
  - `/usage?start_date=<ISO>&end_date=<ISO>` - Usage stats (requires API key in Authorization header)
  - `/invoicing/generate?date=<ISO>&dry_run=<all|validate|none>` - Manual invoice generation
    - `dry_run=all` - Skip all Odoo operations
    - `dry_run=validate` - Check for duplicates only
    - `dry_run=none` - Full run (default)
- `grafana.{location}.inferencebros.com` - Monitoring dashboards
- `bifrost.{location}.inferencebros.com` - Customer & API key management

**Automatic Invoicing:**
- Runs automatically on 2nd of each month at 00:00 UTC
- Bills for previous complete calendar month
- Syncs to Odoo and emails customers

## Installed Software Stack

**Core Infrastructure:**
- K3s - Lightweight Kubernetes
- Kube-VIP - High availability for K3s masters
- MetalLB - LoadBalancer services
- Longhorn - Persistent volume management (optional)
- NVIDIA/AMD GPU Operators (if GPUs present)

**Networking & Security:**
- ingress-nginx - HTTP(S) routing
- cert-manager - SSL certificates (Let's Encrypt + self-signed)
- Dex - Identity provider (OIDC)
- oauth2-proxy - Authentication for internal UIs

**AI & Gateway:**
- KubeAI - Model serving (VLLM/Ollama runners)
- Bifrost - LLM gateway with billing & governance

**Monitoring (optional):**
- Prometheus - Metrics collection
- Grafana - Dashboards
- Loki - Log aggregation
- Tempo - Distributed tracing
- Alertmanager - Alert routing to Slack

**Management UIs:**
- Headlamp - Kubernetes dashboard
- Longhorn UI - Storage management
- PVC Explorer - Browse model cache

## GPU Installation

**NVIDIA on Debian:**
https://github.com/mexersus/debian-nvidia-drivers

For older cards (1050Ti): https://us.download.nvidia.com/XFree86/Linux-x86_64/580.126.09/NVIDIA-Linux-x86_64-580.126.09.run