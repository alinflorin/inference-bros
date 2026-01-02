# inference-bros

## Local dev
Google Drive link: https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN?usp=share_link   
- VirtualBox + Extension Pack
- Download OVA file from Google Drive and import.
- User root password root. SSH working only with keys. Pubkey already included.
- Clone the machine 2 times, total 3 VMs.
- They use Bridge mode for network so they will be like regular devices on your LAN, each with its own IP.
- Boot them, run ifconfig and take note of the IPs. Add the IPs to the terraform input file.
- VM1 - master, VM2, VM3 - workers


- Download terraform.tfvars from Google Drive and add it to the root of this repo. Change the IPs!
- Run terraform plan and apply