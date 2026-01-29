// Centralized content for the Inference Bros landing page

export const heroContent = {
  headline: "Enterprise-Grade LLM Inference at Scale",
  subheadline: "Power your platform with production-ready AI infrastructure. Built on Kubernetes, optimized for performance, designed for intermediaries.",
  primaryCTA: "Request Demo",
  secondaryCTA: "View Documentation",
};

export const stats = [
  { value: "99.9%", label: "Uptime SLA", icon: "CheckmarkCircle" },
  { value: "<50ms", label: "Avg P95 Latency", icon: "Flash" },
  { value: "100+", label: "Models Available", icon: "BrainCircuit" },
  { value: "K3S", label: "Production Kubernetes", icon: "Server" },
];

export const features = [
  {
    icon: "ScaleFill",
    title: "Scalable Infrastructure",
    description: "Auto-scaling Kubernetes cluster (K3S) with high availability via kube-vip. Deploy across multiple GPU servers with intelligent load balancing.",
  },
  {
    icon: "AppsListDetail",
    title: "Multi-Model Support",
    description: "Access 100+ models via our KubeAI integration. Support for OpenAI, Anthropic, and open-source models with unified API endpoints.",
  },
  {
    icon: "ShieldTask",
    title: "Enterprise Security",
    description: "Dex IdP for identity management, oauth2-proxy for authentication, cert-manager with Let's Encrypt SSL. Full data isolation and compliance ready.",
  },
  {
    icon: "MoneyHand",
    title: "Cost Optimization",
    description: "Efficient GPU utilization with Bifrost LLM Gateway routing. Dynamic model loading and caching with Longhorn storage for optimal performance-to-cost ratio.",
  },
  {
    icon: "Gauge",
    title: "Low Latency Performance",
    description: "Optimized inference pipelines with vLLM via KubeAI. Sub-50ms P95 latency for production workloads. Direct GPU access with minimal overhead.",
  },
  {
    icon: "PlugConnected",
    title: "Simple Integration",
    description: "OpenAI-compatible API via Bifrost Gateway. Drop-in replacement for existing implementations. SDKs and client libraries for all major languages.",
  },
  {
    icon: "ChartMultiple",
    title: "Advanced Monitoring",
    description: "Complete observability stack with Prometheus metrics, Grafana dashboards, and Alertmanager. Real-time insights into model performance, costs, and usage patterns.",
  },
  {
    icon: "PeopleTeam",
    title: "24/7 Support",
    description: "Dedicated technical support with direct access to infrastructure engineers. Slack integration for alerts and real-time incident response.",
  },
];

export const useCases = [
  {
    title: "Financial Services",
    description: "Power automated trading analysis, risk assessment, compliance automation, and customer service chatbots with low-latency, secure LLM inference.",
    icon: "Money",
  },
  {
    title: "Healthcare Platforms",
    description: "Enable medical coding, clinical decision support, patient engagement tools, and documentation automation with HIPAA-compliant infrastructure.",
    icon: "Health",
  },
  {
    title: "E-commerce Marketplaces",
    description: "Deploy personalized product recommendations, intelligent search, customer support automation, and dynamic content generation at scale.",
    icon: "ShoppingBag",
  },
  {
    title: "SaaS Providers",
    description: "Embed AI-powered features into your product: content generation, semantic search, workflow automation, and intelligent assistants for your end users.",
    icon: "CloudDatabase",
  },
];

export const pricingTiers = [
  {
    title: "Starter",
    subtitle: "For prototyping and development",
    price: "Contact Sales",
    features: [
      "Up to 1M tokens/month",
      "Access to 50+ models",
      "Standard support (email)",
      "99.5% uptime SLA",
      "API access via Bifrost",
      "Basic monitoring dashboard",
    ],
    highlighted: false,
    ctaText: "Get Started",
  },
  {
    title: "Professional",
    subtitle: "For growing intermediaries",
    price: "Contact Sales",
    features: [
      "Up to 100M tokens/month",
      "Access to 100+ models",
      "Priority support (Slack)",
      "99.9% uptime SLA",
      "Advanced API features",
      "Custom monitoring & alerts",
      "Dedicated infrastructure option",
      "Volume discounts available",
    ],
    highlighted: true,
    ctaText: "Contact Sales",
  },
  {
    title: "Enterprise",
    subtitle: "Custom solutions for scale",
    price: "Custom",
    features: [
      "Unlimited token volume",
      "All models + custom deployments",
      "24/7 dedicated support",
      "99.99% uptime SLA",
      "Dedicated Kubernetes namespace",
      "Custom model fine-tuning",
      "On-premise deployment options",
      "SLA guarantees & legal agreements",
    ],
    highlighted: false,
    ctaText: "Contact Sales",
  },
];

export const ctaSection = {
  headline: "Ready to Scale Your LLM Inference?",
  subheadline: "Join leading intermediaries powering their platforms with production-grade AI infrastructure.",
  ctaText: "Request Demo",
  secondaryText: "or talk to our team",
};

export const footerContent = {
  companyName: "Inference Bros",
  tagline: "Enterprise LLM Inference at Scale",
  description: "Production-ready AI infrastructure for intermediaries. Built on Kubernetes, optimized for performance.",
  links: {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
    ],
    company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "SLA", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
  social: {
    slack: "https://inferencebros.slack.com/",
    github: "#",
    linkedin: "#",
  },
  copyright: `© ${new Date().getFullYear()} Inference Bros. All rights reserved.`,
};
