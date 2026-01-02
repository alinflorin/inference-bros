# inference-bros

## Local dev
- VirtualBox + Extension Pack
- Download OVA file and import: https://drive.google.com/file/d/1lbkoPAPljTYgFu644ZaMU_QBN3TGM5qJ/view?usp=sharing
- User root password root. SSH working only with keys. Pubkey already included.
- Clone the machine 2 times, total 3 VMs.
- They use Bridge mode for network so they will be like regular devices on your LAN, each with its own IP.
- Boot them, run ifconfig and take note of the IPs. Add the IPs to the terraform input file.
- VM1 - master, VM2, VM3 - workers

- Run terraform plan and apply with dev input