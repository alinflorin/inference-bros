# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**inference-bros** is a Kubernetes-based platform for selling AI inference services on bare-metal hardware. It deploys LLM model servers (VLLM, Ollama) managed by KubeAI, fronted by Bifrost (an LLM API gateway with billing/customer management), with automated invoicing via Odoo.

## Repository Structure

- `src/terraform/` — All infrastructure-as-code (K3s cluster, Kubernetes components, apps)
- `src/landing/` — React + TypeScript marketing page (Vite, Tailwind CSS)
- `.github/workflows/` — CI/CD: `terraform.yml`, `landing.yml`, `load-testing.yml`

## Commands

### Landing Page (`src/landing/`)
```bash
npm ci              # Install dependencies
npm run dev         # Start dev server
npm run build       # TypeScript check + Vite build
npm run lint        # ESLint
npm run preview     # Preview production build
```

### Terraform (`src/terraform/`)
```bash
terraform fmt -check -recursive   # Check formatting
terraform validate                 # Validate HCL syntax
terraform init                     # Initialize providers
terraform plan -var-file=<env>.tfvars -out=tfplan
terraform apply tfplan
```

Environments: `local` (dev), `pr` (staging), `stalpeni` (production). Secrets live in `terraform.tfvars` (not committed; sourced from Google Drive).

## Architecture

### Kubernetes Stack
- **K3s** — Lightweight Kubernetes on bare metal (Debian 13), bootstrapped via SSH in `install_k3s.tf`
- **kube-vip** — HA for the K3s API server
- **MetalLB** — Bare-metal LoadBalancer IP allocation
- **ingress-nginx** + **cert-manager** — Ingress with Let's Encrypt + self-signed CA certs
- **Longhorn** — Persistent storage and model caching

### AI/Inference Stack
- **KubeAI** (`kubeai.tf`) — Kubernetes operator managing Model CRDs; runs VLLM/Ollama/FasterWhisper/Infinity containers
- **Bifrost** (`bifrost.tf`) — LLM API gateway providing OpenAI-compatible endpoints, customer/API key management, usage tracking, billing
- **GPU support** (`gpu.tf`) — NVIDIA/AMD operators auto-installed based on detected hardware; resource profiles: `nvidia-unlimited`, `nvidia-older-unlimited`, `cpu-unlimited`, `cpu-avx2-unlimited`, `amd-unlimited`

### Observability (optional)
Prometheus + Grafana + Loki + Fluent Bit + Tempo + Alertmanager → Slack

### Auth & Security
- **Dex** — OIDC identity provider
- **oauth2-proxy** — Protects internal UIs (Headlamp, Grafana, Longhorn, etc.)
- **CloudFlare** — DNS (`*.location.inferencebros.com`) and SSL

### Billing
Usage tracked by Bifrost → invoices generated monthly via Odoo integration (`src/terraform/apps/control/`).

### Custom Apps (`src/terraform/apps/`)
- `control/` — Usage tracking API and invoice generation module
- `sun2000/` — Solar monitoring integration

## Deployment Flow

1. PRs to `src/terraform/**` trigger format check + `terraform plan` with results posted as PR comments
2. PRs to `src/landing/**` trigger build + Cloudflare Pages preview
3. Production deploys require manual `workflow_dispatch` with environment approval gate
4. Load testing runs manually via `load-testing.yml` using `aiperf` (benchmarks TTFT, ITL, throughput)

## Key Conventions

- Each Terraform `.tf` file maps to one component/service (e.g., `bifrost.tf`, `longhorn.tf`, `gpu.tf`)
- Sensitive Terraform variables are marked `sensitive = true`
- KubeAI Model CRDs require `openrouter.ai/json` annotations for pricing/discovery
- Each deployment location is fully isolated (separate domain, accounts, models)
- Reusable patterns are extracted to `src/terraform/modules/` (e.g., `generic-node-app/`)
