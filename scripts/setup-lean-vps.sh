#!/bin/bash
# Run this on the Vultr VPS as root to set up lean stack (Postgres, Redis, Typesense)
set -e

echo "==> Installing Docker..."
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2
systemctl enable docker && systemctl start docker

echo "==> Cloning Ascend..."
cd /opt
rm -rf Ascend
git clone https://github.com/Recon-X2025/Ascend.git
cd Ascend

echo "==> Creating .env.lean (edit passwords if needed)..."
cat > .env.lean << 'ENVEOF'
POSTGRES_PASSWORD=ascend123
REDIS_PASSWORD=ascend123
TYPESENSE_API_KEY=ascend_search_key
ENVEOF

echo "==> Starting Postgres, Redis, Typesense..."
docker compose -f docker-compose.lean.yml up -d

echo "==> Waiting for Postgres..."
sleep 5
until docker exec ascend-postgres pg_isready -U ascend -d ascend 2>/dev/null; do sleep 1; done

echo "==> Opening firewall (5432, 6379, 8108)..."
ufw allow 5432/tcp 2>/dev/null || true
ufw allow 6379/tcp 2>/dev/null || true
ufw allow 8108/tcp 2>/dev/null || true
ufw allow 22/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true

VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "==> Lean stack is ready!"
echo "VPS IP: $VPS_IP"
echo "DATABASE_URL=postgresql://ascend:ascend123@$VPS_IP:5432/ascend"
echo "REDIS_HOST=$VPS_IP REDIS_PORT=6379 REDIS_PASSWORD=ascend123"
echo "TYPESENSE_HOST=$VPS_IP TYPESENSE_PORT=8108 TYPESENSE_PROTOCOL=http TYPESENSE_API_KEY=ascend_search_key"
echo ""
echo "Run migrations from your local machine:"
echo "  DATABASE_URL=\"postgresql://ascend:ascend123@$VPS_IP:5432/ascend\" npx prisma migrate deploy"
echo "  DATABASE_URL=\"postgresql://ascend:ascend123@$VPS_IP:5432/ascend\" npx prisma db seed"
echo ""
echo "Add these to Vercel Project → Settings → Environment Variables"
