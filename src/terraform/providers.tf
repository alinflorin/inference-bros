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
  burst_limit = 300
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

provider "minio" {
  minio_server   = replace(var.s3_url, "/^https?:\\/\\//", "")
  minio_user     = var.s3_key_id
  minio_password = var.s3_key_secret
  minio_region   = "global"
}
