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
- `k3s.stalpeni.inferencebros.com:6443` - Kubernetes API
- `dex.stalpeni.inferencebros.com` - Identity provider (OIDC)
- `oauth2-proxy.stalpeni.inferencebros.com` - Authentication proxy
- `headlamp.stalpeni.inferencebros.com` - Kubernetes management
- `grafana.stalpeni.inferencebros.com` - Monitoring & dashboards
- `prometheus.stalpeni.inferencebros.com` - Metrics collection
- `alertmanager.stalpeni.inferencebros.com` - Alert management
- `longhorn.stalpeni.inferencebros.com` - Storage management
- `bifrost.stalpeni.inferencebros.com` - LLM gateway & customer management
- `models.stalpeni.inferencebros.com` - Model storage browser
- `control.stalpeni.inferencebros.com` - Invoicing & usage API

## Requirements

- 1 or more **Debian 13 (trixie)** servers with:
  - Root SSH access with your public key already trusted
  - GPU drivers installed (if using GPUs)
  - Static IPs configured on same LAN
- At least 2 free IPs on your LAN subnet:
  - **kube_vip IP** - Virtual IP for high-availability Kubernetes API (e.g., 192.168.1.252)
  - **MetalLB NGINX IP** - LoadBalancer IP for all web services (e.g., 192.168.1.240)
- For production: Public IP with port forwarding for:
  - SSH (2201, 2202, etc. → server port 22)
  - HTTPS (443 → MetalLB NGINX IP)
  - K3s API (6443 → kube_vip IP)

**IP Explanation:**
- **Server IPs** - Each physical server's static IP on your LAN
- **kube_vip** - Floats between master nodes for K3s API redundancy
- **MetalLB NGINX** - Single IP where all ingress traffic lands (Grafana, Bifrost, etc.)

## Development Setup

### 1. Prepare Secret Files
Download `terraform.tfvars` from Google Drive and add it to the repo root.

### 2. Configure Local Development
- You need a Debian 13 machine on your LAN with your SSH key added as trusted
- Note the machine's IP address
- Update `terraform.tfvars` with the machine IP and network settings
- Edit `/etc/hosts` on both dev machine AND the Debian machine:

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

**1. QWEN 2.5-0.5B-Instruct:**
```yaml
apiVersion: kubeai.org/v1
kind: Model
metadata:
  annotations:
    openrouter.ai/json: |
      {
        "id": "Qwen2.5-0.5B-Instruct",
        "hugging_face_id": "Qwen/Qwen2.5-0.5B-Instruct",
        "name": "Qwen2.5-0.5B-Instruct",
        "created": 1690502400,
        "input_modalities": ["text"],
        "output_modalities": ["text"],
        "quantization": "bf16",
        "context_length": 4096,
        "max_output_length": 1024,
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
          "structured_outputs"
        ],
        "description": "Qwen's most used model",
        "openrouter": {
          "slug": "InferenceBros-Local/Qwen2.5-0.5B-Instruct"
        },
        "datacenters": [
          {
            "country_code": "RO"
          }
        ]
      }
  name: Qwen2.5-0.5B-Instruct
  namespace: kubeai
spec:
  engine: VLLM # or OLlama
  # For VLLM, use args:
  args:
    - --gpu-memory-utilization=0.9
    - --dtype=half
    - --max-model-len=1024
  ##################################
  features:
    - TextGeneration
  minReplicas: 1
  replicas: 1
  resourceProfile: nvidia-older-unlimited:1 # or nvidia-unlimited:1 for newer NVidia cards. or amd-unlimited:1 for AMD cards. or cpu-unlimited:1 for CPU
  url: hf://Qwen/Qwen2.5-0.5B-Instruct # for OLlama use GGUF: ollama://hf.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF:qwen2.5-0.5b-instruct-q4_k_m.gguf
  cacheProfile: storage # for VLLM only and only if you use Longhorn, so ReadWriteMany works!
```

**Notes:**
- Model caching (`cacheProfile: storage`) is only supported on VLLM
- Only use `cacheProfile` if Longhorn is installed
- Full openrouter.ai/json schema available in original README

## Customer Management

### Adding Customers
1. Go to Bifrost portal: `https://bifrost.{location}.inferencebros.com`
2. Navigate to **Governance > Users & Groups > Customers**
3. Click **Add Customer** and create a new customer with your name
4. Navigate to **Governance > Virtual Keys**
5. Click **Create New Key**:
   - Link it to the customer you just created
   - Copy the generated API key

### Testing with Cherry Studio
1. Install **Cherry Studio**: https://www.cherry-ai.com/download
2. Open Cherry Studio and go to **Settings > Model Provider**
3. Disable all existing providers
4. Click **Add New Provider**:
   - Type: `openai`
   - URL: `https://bifrost.{location}.inferencebros.com`
   - API Key: Paste the key from Bifrost
5. Click **Manage Models** and select the models you want to use
6. Start chatting!

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

## Available Locations/Environments

The infrastructure supports multiple deployment locations. Each location is independent:

- **local** - Development environment
- **stalpeni** - Production environment in Romania
- **pr** - Preview/staging fake environment

Each location has its own:
- Domain: `{service}.{location}.inferencebros.com`
- User accounts and access control via Dex
- Independent customer database and billing
- Separate model deployments and pricing