#!/usr/bin/env bash
set -euo pipefail

# Usage: bash create-envs.sh <PUBLIC_HOST>
# Example: bash create-envs.sh 89.32.251.74

HOST=${1:-}
if [[ -z "$HOST" ]]; then
  echo "Usage: bash create-envs.sh <PUBLIC_HOST>"
  exit 1
fi

cat > .env.production <<ENV
PORT=3000
NEXT_PUBLIC_API_URL=http://$HOST
ENV

mkdir -p shop-backend
cat > shop-backend/.env <<ENV
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shop
ALLOWED_ORIGINS=http://$HOST,https://$HOST
JWT_SECRET=$(openssl rand -hex 24)
ENABLE_JOBS=true
ENV

echo "Created .env.production and shop-backend/.env for host: $HOST"


