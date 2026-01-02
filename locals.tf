locals {
  masters = [
    for s in var.servers : s if s.master
  ]

  workers = [
    for s in var.servers : s if !s.master
  ]

  first_master  = local.masters[0]
  other_masters = slice(local.masters, 1, length(local.masters))
}
