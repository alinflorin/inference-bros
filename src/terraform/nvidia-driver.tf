# Install NVIDIA drivers on Debian hosts before k3s installation
# This is required because the GPU operator runs with driver.enabled: false

resource "ssh_sensitive_resource" "install_nvidia_driver" {
  for_each = var.kubeai_compute_processor == "nvidia" ? {
    for s in var.servers : s.hostname => s
  } : {}

  host        = each.value.ssh_ip_or_hostname
  user        = each.value.user
  port        = each.value.port
  agent       = false
  private_key = var.ssh_private_key

  when = "create"

  triggers = {
    hostname = each.value.hostname
  }

  timeout = "30m"

  commands = [
    # Add non-free repository for NVIDIA drivers
    "grep -q 'non-free' /etc/apt/sources.list || sed -i 's/main/main contrib non-free non-free-firmware/g' /etc/apt/sources.list",

    # Update package list
    "apt-get update",

    # Install kernel headers (required for driver compilation)
    "apt-get install -y linux-headers-$(uname -r)",

    # Install NVIDIA driver and firmware
    "apt-get install -y nvidia-driver firmware-misc-nonfree",

    # Load the nvidia module
    "modprobe nvidia || true",

    # Reboot to load the driver
    "reboot"
  ]
}

# Wait for servers to come back online after reboot
resource "ssh_sensitive_resource" "wait_after_nvidia_reboot" {
  for_each = var.kubeai_compute_processor == "nvidia" ? {
    for s in var.servers : s.hostname => s
  } : {}

  host        = each.value.ssh_ip_or_hostname
  user        = each.value.user
  port        = each.value.port
  agent       = false
  private_key = var.ssh_private_key

  when = "create"

  triggers = {
    hostname = each.value.hostname
  }

  timeout = "10m"

  commands = [
    # Wait a bit for the system to fully boot
    "sleep 30",

    # Verify NVIDIA driver is loaded
    "nvidia-smi",

    "echo 'NVIDIA driver verified successfully'"
  ]

  depends_on = [ssh_sensitive_resource.install_nvidia_driver]
}

# Null resource to track nvidia driver installation completion
resource "null_resource" "nvidia_driver_installed" {
  count = var.kubeai_compute_processor == "nvidia" ? 1 : 0

  depends_on = [ssh_sensitive_resource.wait_after_nvidia_reboot]
}
