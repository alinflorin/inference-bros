locals {
  dex_users_map = {
    for u in var.dex_users : u.username => u
  }
}

resource "helm_release" "cluster_admins" {
  for_each = local.dex_users_map
  name             = "cluster-admin-${each.key}"
  repository       = "https://ameijer.github.io/k8s-as-helm/"
  chart            = "clusterrolebinding"
  namespace        = "default"
  create_namespace = true
  version          = "1.0.0"
  atomic           = true
  wait             = true

  values = [
    <<-EOT
      roleRef:
        apiGroup: rbac.authorization.k8s.io
        name: cluster-admin
        kind: ClusterRole
      
      subjects:
        - kind: User
          name: ${each.value.email}
          apiGroup: rbac.authorization.k8s.io
    EOT

  ]

  depends_on = [helm_release.dex]
}
