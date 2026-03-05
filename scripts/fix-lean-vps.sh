#!/bin/bash
# Fix lean VPS: stop port conflicts, bring up Postgres + Redis + Typesense
# Run from your Mac. You'll be asked for your VPS password once.
# Usage: ./scripts/fix-lean-vps.sh [VPS_IP]
# Default IP: 139.84.213.110

set -e
VPS_IP="${1:-139.84.213.110}"

echo "=========================================="
echo "  Fix Lean VPS — Postgres, Redis, Typesense"
echo "  VPS: root@$VPS_IP"
echo "=========================================="
echo ""
echo "You'll be asked for your VPS password (from Vultr dashboard)."
echo ""

ssh -o ConnectTimeout=10 root@"$VPS_IP" 'bash -s' << 'REMOTE'
set -e

echo "==> Stopping anything using ports 5432, 6379, 8108, 8109..."
apt install -y psmisc 2>/dev/null || true  # for fuser
systemctl stop postgresql 2>/dev/null || true
systemctl stop redis 2>/dev/null || true
systemctl stop redis-server 2>/dev/null || true

for port in 5432 6379 8108 8109; do
  fuser -k $port/tcp 2>/dev/null || true
done
sleep 2

echo "==> Stopping old Docker containers..."
cd /opt/Ascend 2>/dev/null || (cd /opt && git clone https://github.com/Recon-X2025/Ascend.git && cd Ascend)
docker compose -f docker-compose.lean.yml down 2>/dev/null || true

echo "==> Ensuring .env.lean exists..."
if [ ! -f .env.lean ]; then
  cat > .env.lean << 'ENVEOF'
POSTGRES_PASSWORD=ascend123
REDIS_PASSWORD=ascend123
TYPESENSE_API_KEY=ascend_search_key
ENVEOF
fi

echo "==> Starting Postgres, Redis, Typesense..."
docker compose -f docker-compose.lean.yml up -d

echo "==> Waiting for Postgres to be ready..."
for i in {1..30}; do
  if docker exec ascend-postgres pg_isready -U ascend -d ascend 2>/dev/null; then
    break
  fi
  sleep 1
done

echo "==> Opening firewall (if ufw is available)..."
ufw allow 5432/tcp 2>/dev/null || true
ufw allow 6379/tcp 2>/dev/null || true
ufw allow 8109/tcp 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true

VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "=========================================="
echo "  Lean stack is READY"
echo "=========================================="
echo ""
echo "Copy these for Vercel (Project → Settings → Environment Variables):"
echo ""
echo "DATABASE_URL=postgresql://ascend:ascend123@$VPS_IP:5432/ascend"
echo "REDIS_HOST=$VPS_IP"
echo "REDIS_PORT=6379"
echo "REDIS_PASSWORD=ascend123"
echo "TYPESENSE_HOST=$VPS_IP"
echo "TYPESENSE_PORT=8109"
echo "TYPESENSE_PROTOCOL=http"
echo "TYPESENSE_API_KEY=ascend_search_key"
echo ""
REMOTE

echo ""
echo "==> Done! Next steps:"
echo "1. Add the variables above to Vercel"
echo "2. Run migrations from this machine:"
echo "   DATABASE_URL=\"postgresql://ascend:ascend123@$VPS_IP:5432/ascend\" npx prisma migrate deploy"
echo "   DATABASE_URL=\"postgresql://ascend:ascend123@$VPS_IP:5432/ascend\" npx prisma db seed"
echo "3. Deploy: vercel --prod"
echo ""
