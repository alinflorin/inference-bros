output "k3s_kubeconfig_for_users" {
  description = "Kubeconfig content for users to access the K3s cluster"
  value       = local.k3s_kubeconfig_for_users
  sensitive   = true
}