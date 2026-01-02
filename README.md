# inference-bros

## Local dev
- VirtualBox + Extension Pack
- Download OVA file and import: https://drive.google.com/file/d/1SipJrZvbng4HZPFj2zcbQGGtiQyZDAeF/view?usp=sharing
- User root password root. SSH working only with keys. Pubkey already included.
- Clone the machine 2 times, total 3 VMs.
- Ensure each has unique MAC and IP
- Setup port forwarding for each for ports 22 (2201, 2202, 2203 target host ports).

- Run terraform plan and apply with dev input