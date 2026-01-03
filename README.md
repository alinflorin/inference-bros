# inference-bros

## Local dev
Google Drive link: https://drive.google.com/drive/folders/1M8WCE3i4FGNXZ1uMWLwcyquWPW4AF9pN?usp=share_link   
- Install VirtualBox + Extension Pack
- Download terraform.tfvars from Google Drive and add it to the root of this repo.
- Download OVA file from Google Drive and import.
- User root password root. SSH working only with keys. Pubkey already included.
- Boot it, run ifconfig and take note of the IP. Add the IP to the terraform input file in the servers section.
- Add another IP for kube_vip in terraform.tfvars, any free IP on your network.
- Modify domain var accordingly (use VM IP).
- Run terraform plan and apply