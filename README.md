# inference-bros

## Local dev
- VirtualBox + Extension Pack
- https://dl-cdn.alpinelinux.org/alpine/v3.23/releases/x86_64/alpine-virt-3.23.2-x86_64.iso - use this as cdrom
- Install alpine on disk
- apk add openssh
- Install 2 VMs with Alpine, user root, add SSH PUB key to trusted keys
- Get IPs of VMs, configure terraform input accordingly.
- TF plan & apply