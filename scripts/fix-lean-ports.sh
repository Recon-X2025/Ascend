#!/bin/bash
# Run this ON the VPS (after ssh root@139.84.213.110) to fix port conflict
# Native Postgres/Redis are using 5432/6379 — we stop them so Docker can use them
set -e
echo "==> Stopping native PostgreSQL and Redis (if running)..."
systemctl stop postgresql 2>/dev/null || true
systemctl stop redis 2>/dev/null || true
systemctl stop redis-server 2>/dev/null || true
echo "==> Removing failed Docker containers..."
cd /opt/Ascend
docker compose -f docker-compose.lean.yml down 2>/dev/null || true
echo "==> Starting Postgres, Redis, Typesense in Docker..."
docker compose -f docker-compose.lean.yml up -d
echo "==> Waiting for Postgres..."
sleep 5
until docker exec ascend-postgres pg_isready -U ascend -d ascend 2>/dev/null; do sleep 1; done
echo "==> Done! Services are running."
docker compose -f docker-compose.lean.yml ps
