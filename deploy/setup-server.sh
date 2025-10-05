#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo bash setup-server.sh [--with-mongo]

WITH_MONGO=false
if [[ "${1:-}" == "--with-mongo" ]]; then
  WITH_MONGO=true
fi

echo "[1/6] Updating system and installing Node.js 20, Nginx, PM2..."
apt update -y
apt upgrade -y
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs build-essential
fi
apt install -y nginx unzip
npm i -g pm2

if [ "$WITH_MONGO" = true ]; then
  echo "[1b] Installing MongoDB (Ubuntu repo variant)..."
  apt install -y mongodb || true
  systemctl enable --now mongodb || true
fi

echo "[2/6] Creating app directory /var/www/my-shop2 ..."
mkdir -p /var/www/my-shop2
chown -R $SUDO_USER:$SUDO_USER /var/www/my-shop2 || true

echo "[3/6] Installing project dependencies..."
cd /var/www/my-shop2
if [ -f package-lock.json ] || [ -f package.json ]; then
  npm ci || npm install
fi
if [ -d shop-backend ]; then
  cd shop-backend && npm ci || npm install; cd -
fi

echo "[4/6] Building frontend..."
if [ -f package.json ]; then
  npm run build
fi

echo "[5/6] Starting services with PM2..."
cat > /var/www/my-shop2/ecosystem.config.json <<'JSON'
{
  "apps": [
    { "name": "api", "script": "shop-backend/app.js", "env": { "NODE_ENV": "production", "PORT": "5000" } },
    { "name": "web", "script": "npm", "args": "start", "env": { "PORT": "3000" } }
  ]
}
JSON
pm2 start /var/www/my-shop2/ecosystem.config.json || pm2 restart ecosystem.config.json
pm2 save

echo "[6/6] Enabling PM2 startup..."
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER || true

echo "Done. Use: pm2 status"


