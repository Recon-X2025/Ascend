#!/bin/bash
# Run this from your Mac terminal (not on the VPS).
# Replace 139.84.213.110 with your actual VPS IP from Vultr dashboard.
VPS_IP="${1:-139.84.213.110}"
echo "Connecting to root@$VPS_IP and running lean setup..."
ssh root@"$VPS_IP" 'curl -sO https://raw.githubusercontent.com/Recon-X2025/Ascend/main/scripts/setup-lean-vps.sh && chmod +x setup-lean-vps.sh && ./setup-lean-vps.sh'
echo ""
echo "Done! Now add env vars to Vercel and run migrations (see DEPLOY_LEAN.md)"
