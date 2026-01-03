provider "ssh" {
  # Configuration options
}

provider "kubernetes" {
  host                   = local.k3s_kubeconfig_url
  client_certificate     = local.k3s_kubeconfig_object.users[0].user.client_certificate_data
  client_key             = local.k3s_kubeconfig_object.users[0].user.client_key_data
  cluster_ca_certificate = local.k3s_kubeconfig_object.clusters[0].cluster.certificate_authority_data
  insecure               = true
}

provider "helm" {
  kubernetes = {
    host                   = local.k3s_kubeconfig_url
    client_certificate     = local.k3s_kubeconfig_object.users[0].user.client_certificate_data
    client_key             = local.k3s_kubeconfig_object.users[0].user.client_key_data
    cluster_ca_certificate = local.k3s_kubeconfig_object.clusters[0].cluster.certificate_authority_data
    insecure               = true
  }
}
