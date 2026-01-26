provider "ssh" {
  # Configuration options
}

provider "kubernetes" {
  host                   = local.k3s_kubeconfig_url
  client_certificate     = base64decode(local.k3s_kubeconfig_object.users[0].user.client-certificate-data)
  client_key             = base64decode(local.k3s_kubeconfig_object.users[0].user.client-key-data)
  cluster_ca_certificate = base64decode(local.k3s_kubeconfig_object.clusters[0].cluster.certificate-authority-data)
}

provider "helm" {
  burst_limit = 900
  kubernetes = {
    host                   = local.k3s_kubeconfig_url
    client_certificate     = base64decode(local.k3s_kubeconfig_object.users[0].user.client-certificate-data)
    client_key             = base64decode(local.k3s_kubeconfig_object.users[0].user.client-key-data)
    cluster_ca_certificate = base64decode(local.k3s_kubeconfig_object.clusters[0].cluster.certificate-authority-data)
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}