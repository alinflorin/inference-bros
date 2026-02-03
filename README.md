# inference-bros

A Kubernetes-based platform for selling AI inference services. This infrastructure runs on bare-metal servers and deploys language models that customers can access via API.

## 1. Purpose

This platform allows you to:
- Deploy and serve AI language models (like Qwen, Llama, etc.) on your own hardware
- Manage customer access and billing through Bifrost gateway
- Monitor usage and generate invoices automatically via Odoo integration
- Provide OpenAI-compatible API endpoints for easy integration

## 2. Hardware Requirements

### Production/Staging Servers
- **Operating System:** Debian 13 (trixie)
- **Access:** Root SSH access with your public key already trusted
- **GPU Drivers:** Pre-installed (if using GPUs for model inference)
- **Networking:** Static IPs configured on same LAN
- **Minimum Servers:** 1 or more (3+ recommended for HA)

### Network IP Requirements
You'll need at least 2 free IPs on your LAN subnet:
- **kube_vip IP** - Virtual IP for high-availability Kubernetes API (e.g., 192.168.1.252)
- **MetalLB NGINX IP** - LoadBalancer IP for all web services (e.g., 192.168.1.240)

**IP Explanation:**
- **Server IPs** - Each physical server's static IP on your LAN
- **kube_vip** - Floats between master nodes for K3s API redundancy
- **MetalLB NGINX** - Single IP where all ingress traffic lands (Grafana, Bifrost, etc.)

### Public Access (Production)
For production deployments, you need a public IP with port forwarding:
- SSH (2201, 2202, etc. → server port 22)
- HTTPS (443 → MetalLB NGINX IP)
- K3s API (6443 → kube_vip IP)

### GPU Installation Notes
**NVIDIA on Debian:**
https://github.com/mexersus/debian-nvidia-drivers

For older cards (1050Ti): https://us.download.nvidia.com/XFree86/Linux-x86_64/580.126.09/NVIDIA-Linux-x86_64-580.126.09.run

## 3. Installed Software & Links

### Software Stack

**Core Infrastructure:**
- **K3s** - Lightweight Kubernetes distribution
- **Kube-VIP** - High availability for K3s masters
- **MetalLB** - LoadBalancer services for bare-metal
- **Longhorn** - Persistent volume management (optional, enables model caching)
- **NVIDIA/AMD GPU Operators** - Automatically installed if GPUs are detected

**Networking & Security:**
- **ingress-nginx** - HTTP(S) routing and load balancing
- **cert-manager** - SSL certificates (Let's Encrypt + self-signed)
- **Dex** - Identity provider (OIDC authentication)
- **oauth2-proxy** - Authentication proxy for internal UIs

**AI & Gateway:**
- **KubeAI** - Model serving orchestration (supports VLLM/Ollama runners)
- **Bifrost** - LLM gateway with billing, governance, and customer management

**Monitoring Stack (optional):**
- **Prometheus** - Metrics collection and storage
- **Grafana** - Monitoring dashboards and visualization
- **Loki** - Log aggregation
- **Tempo** - Distributed tracing
- **Alertmanager** - Alert routing to Slack

**Management UIs:**
- **Headlamp** - Kubernetes dashboard for cluster management
- **Longhorn UI** - Storage management interface
- **PVC Explorer** - Browse model cache contents
- **VUI** - Velero management for backups

### Service URLs & Access

**Live Deployments (Stalpeni Example):**

All services follow the pattern: `https://{service}.{location}.inferencebros.com`

- `k3s.stalpeni.inferencebros.com:6443` - Kubernetes API
- `dex.stalpeni.inferencebros.com` - Identity provider (OIDC)
- `oauth2-proxy.stalpeni.inferencebros.com` - Authentication proxy
- `headlamp.stalpeni.inferencebros.com` - Kubernetes management dashboard
- `grafana.stalpeni.inferencebros.com` - Monitoring & dashboards
- `prometheus.stalpeni.inferencebros.com` - Metrics collection
- `alertmanager.stalpeni.inferencebros.com` - Alert management
- `longhorn.stalpeni.inferencebros.com` - Storage management
- `bifrost.stalpeni.inferencebros.com` - LLM gateway & customer management
- `models.stalpeni.inferencebros.com` - Model storage browser
- `control.stalpeni.inferencebros.com` - Invoicing & usage API
- `vui.stalpeni.inferencebros.com` - Velero UI - backup solution

**Available Locations:**
- **local** - Development environment
- **stalpeni** - Production environment in Romania
- **pr** - Preview/staging environment

Each location is completely independent with its own domain, user accounts, customer database, billing, and model deployments.

## 4. How to Use

### Connecting to the Cluster

Before you can deploy models or manage the platform, you need to connect to the K3s cluster. There are several ways to do this:

**Option 1: Use Hosted Headlamp (Easiest)**
- Navigate to `https://headlamp.{location}.inferencebros.com`
- Authenticate via Dex/OAuth2
- Manage resources directly in the web UI

**Option 2: Local kubectl Access**

1. **Get the kubeconfig:**
   - Go to https://app.terraform.io/app/inference-bros/workspaces
   - Select your workspace → Latest State → View
   - Copy `k3s_kubeconfig_for_users` from the JSON
   
2. **Save the kubeconfig:**
   ```bash
   # Save to default location
   mkdir -p ~/.kube
   # Paste the kubeconfig content to ~/.kube/config
   ```

3. **Install required tools:**
   - **kubectl:** Kubernetes command-line tool
   - **int128/kubelogin:** OIDC authentication plugin
     - Download from: https://github.com/int128/kubelogin/releases
     - Rename executable to `kubectl-oidc_login`
     - Place in your PATH (e.g., `/usr/local/bin/`)

4. **Install a cluster management tool (optional):**
   - **Lens (Freelens):** Desktop Kubernetes IDE - https://k8slens.dev/
   - **k9s:** Terminal-based cluster manager - https://k9scli.io/

5. **Test your connection:**
   ```bash
   kubectl get nodes
   # This will trigger OIDC login via browser
   ```

### Deploying Models

Use the **Headlamp dashboard** to create Model resources. All models require the `openrouter.ai/json` annotation for API discovery and pricing.

**Reference Documentation:**
- [KubeAI Model CRD Specification](https://github.com/kubeai-project/kubeai/blob/main/docs/reference/kubernetes-api.md)

**Available Resource Profiles:**
- `nvidia-unlimited` - Modern NVIDIA GPUs (RTX 20xx+)
- `nvidia-older-unlimited` - Pascal architecture GPUs (GTX 10xx)
- `cpu-unlimited` - Generic CPU inference
- `cpu-avx2-unlimited` - CPUs with AVX2 support
- `amd-unlimited` - All AMD GPUs

**Supported Model Runners:**
- **VLLM** - Recommended for production (supports model caching with Longhorn)
- **Ollama** - Alternative runner

#### Example: QWEN 2.5-0.5B-Instruct

```yaml
apiVersion: kubeai.org/v1
kind: Model
metadata:
  annotations:
    openrouter.ai/json: |
      {
        "id": "qwen25-05b-instruct",
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
          "slug": "inferencebros-local/qwen25-05b-instruct"
        },
        "datacenters": [
          {
            "country_code": "RO"
          }
        ]
      }
  name: qwen25-05b-instruct
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
  resourceProfile: nvidia-older-unlimited:1 # Add :1 suffix to resource profile
  url: hf://Qwen/Qwen2.5-0.5B-Instruct # For Ollama use: ollama://hf.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF:qwen2.5-0.5b-instruct-q4_k_m.gguf
  cacheProfile: storage # VLLM only, requires Longhorn for ReadWriteMany support
```

**Important Notes:**
- Model caching (`cacheProfile: storage`) is only supported with VLLM
- Only use `cacheProfile` if Longhorn is installed
- Full openrouter.ai/json schema documentation available in original KubeAI docs

### Customer Management via Bifrost

**Adding New Customers:**

1. Navigate to Bifrost portal: `https://bifrost.{location}.inferencebros.com`
2. Go to **Governance > Users & Groups > Customers**
3. Click **Add Customer** and fill in customer details
4. Navigate to **Governance > Virtual Keys**
5. Click **Create New Key**:
   - Link it to the customer you just created
   - Copy the generated API key for the customer

**Testing Customer Access with Cherry Studio:**

1. Install **Cherry Studio**: https://www.cherry-ai.com/download
2. Open Cherry Studio and navigate to **Settings > Model Provider**
3. Disable all existing providers
4. Click **Add New Provider**:
   - Type: `openai`
   - URL: `https://bifrost.{location}.inferencebros.com`. For local it should be `http://bifrost-insecure.local.inferencebros.com`.
   - API Key: Paste the key from Bifrost
5. Click **Manage Models** and select available models
6. Start chatting to test the deployment!

### Control Module APIs

The control service exposes a GUI at `/` and several APIs at `control.{location}.inferencebros.com`:

**Public Endpoints:**
- `/openrouter/models` - List all available models with pricing
- `/bifrost/pricingSheet` - Current pricing information

**Authenticated Endpoints** (require API key in Authorization header):
- `/usage?start_date=<ISO>&end_date=<ISO>` - Query usage statistics for date range
- `/invoicing/generate?date=<ISO>&dry_run=<all|validate|none>` - Manual invoice generation
  - `dry_run=all` - Skip all Odoo operations (test mode)
  - `dry_run=validate` - Check for duplicate invoices only
  - `dry_run=none` - Full run with Odoo sync (default)

**Automatic Invoicing:**
- Runs automatically on the 2nd of each month at 00:00 UTC
- Bills for the previous complete calendar month
- Automatically syncs invoices to Odoo and emails customers

### Monitoring & Alerts

**Grafana Dashboard:**
- Access: `https://grafana.{location}.inferencebros.com`
- Pre-configured dashboards for:
  - Model inference metrics (requests/sec, latency, tokens/sec)
  - GPU utilization and memory
  - Customer usage patterns
  - Billing and revenue tracking
  - Kubernetes cluster health

**Bifrost Portal Monitoring:**
- Access: `https://bifrost.{location}.inferencebros.com`
- Real-time customer usage
- API key management and rotation
- Rate limiting and quota monitoring

**AlertManager to Slack:**
- Critical alerts automatically sent to Slack workspace

## 5. How to Develop

### Developer Hardware Requirements

- **Development Machine:** Debian 13 on your LAN (can be a VM with Network mode = bridge)
- **SSH Access:** SSH key from Google Drive added as trusted on dev machine
- **Network:** Same LAN as your development server(s)
- **Local Access:** Ability to edit `/etc/hosts` file

### Developer Software Requirements

- **Terraform:** Latest version
- **VSCode:** Recommended IDE with extensions:
  - HashiCorp Terraform
  - Kubernetes
  - YAML
- **kubectl:** Kubernetes command-line tool
- **Git:** For version control
- **SSH Client:** For server access

### Developer Setup Steps

#### Step 1: Prepare Secret Files
Download `terraform.tfvars` from Google Drive (see section 6: External Accounts) and place it in the repo root directory.

#### Step 2: Configure Development Server
- Ensure your Debian 13 machine has the Google Drive SSH key added as trusted
- Note the machine's static IP address (e.g., 192.168.1.100)
- Update `terraform.tfvars` with:
  - Server IP address
  - kube_vip IP (e.g., 192.168.1.252)
  - MetalLB NGINX IP (e.g., 192.168.1.240)
  - Other network settings for your LAN

#### Step 3: Configure Local DNS
Edit `/etc/hosts` on your development machine:

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
192.168.1.240 vui.local.inferencebros.com
```

#### Step 4: Deploy Infrastructure

```bash
cd src/terraform
terraform plan
terraform apply
```

#### Step 5: Get Cluster Access

After deployment, retrieve your kubeconfig:

```bash
terraform output k3s_kubeconfig_for_users
```

Save this kubeconfig to `~/.kube/config` or use with `KUBECONFIG` environment variable. Then follow the "Connecting to the Cluster" instructions in section 4 to install kubectl-oidc_login and test your connection.

## 6. External Accounts & Tools

**Google Drive (Secret Files):**
- https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN
- Contains: `terraform.tfvars`, SSH keys, and other sensitive configuration files

**Terraform Cloud (Infrastructure State):**
- https://app.terraform.io/app/inference-bros/workspaces
- Manages infrastructure state for all environments
- Access workspace state files to retrieve kubeconfig

**CloudFlare (DNS Management):**
- https://dash.cloudflare.com/f159b7db29dec75259ced7d4ad1c4a18/inferencebros.com
- Manages DNS records for `inferencebros.com`
- Configure SSL/TLS settings and subdomain routing

**Slack (Alerts & Notifications):**
- https://inferencebros.slack.com/
- Receives alerts from AlertManager
- Channels for monitoring, incidents, and billing notifications

**Odoo (Invoicing System):**
- https://inferencebros.odoo.com/odoo
- Automated invoice generation and customer billing
- Syncs with Control module for usage-based billing

---

## Load Testing
Tool to be used locally and in GitHub Actions https://github.com/Yoosu-L/llmapibenchmark
See src/perf.
---

## Quick Reference

**Model Deployment:** Headlamp UI → Create Model resource with openrouter.ai/json annotation  
**Customer Setup:** Bifrost UI → Governance → Customers & Virtual Keys  
**Monitoring:** Grafana dashboards + Bifrost portal  
**Invoicing:** Automatic monthly or manual via Control API  
**Development:** Terraform apply → Get kubeconfig → kubectl/Headlamp