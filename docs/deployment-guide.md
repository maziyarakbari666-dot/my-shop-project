## راهنمای استقرار پروژه my-shop2 (Production)

این سند مراحل کامل دیپلوی نسخه تولیدی پروژه را روی سرور لینوکسی (Ubuntu + Nginx + SSL + PM2 + MongoDB) توضیح می‌دهد.

### معماری
- **Frontend (Next.js 15)**: اجرا روی پورت 3000، دارای `rewrites` برای ارسال `/api` به بک‌اند.
- **Backend (Express + Mongoose)**: اجرا روی پورت 5000، سرویس‌دهی به مسیرهای `/api/*` و فایل‌های استاتیک در `/uploads`.
- **Database (MongoDB)**: متصل از طریق `MONGO_URI`.

### متغیرهای محیطی
#### Frontend (فایل `.env.production` در ریشه)
```
PORT=3000
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
# اگر Nginx مسیر /api را پروکسی می‌کند:
# NEXT_PUBLIC_API_URL=https://your-domain.com
```

#### Backend (فایل `shop-backend/.env`)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shop
ALLOWED_ORIGINS=https://your-domain.com
JWT_SECRET=change_me
ENABLE_JOBS=true

# اختیاری
FREE_SHIPPING_THRESHOLD=500000
PUBLIC_BASE_URL=https://your-domain.com
FRONTEND_BASE_URL=https://your-domain.com
ZARINPAL_MERCHANT_ID=xxxx
ZARINPAL_SANDBOX=false
ZARINPAL_SEND_IN_RIAL=true

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=***
SMTP_SECURE=false
MAIL_FROM=Shop <no-reply@example.com>
```

### پیش‌نیازها
- Ubuntu 22.04/24.04
- Node.js 20 LTS
- PM2
- Nginx
- MongoDB (لوکال یا مدیریت‌شده)

### نصب نرم‌افزارها روی سرور
```
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential nginx
sudo npm i -g pm2

# MongoDB (اختیاری اگر لوکال)
sudo apt install -y mongodb
sudo systemctl enable --now mongodb
```

### دریافت کد و نصب وابستگی‌ها
```
sudo mkdir -p /var/www/my-shop2 && sudo chown $USER:$USER /var/www/my-shop2
cd /var/www/my-shop2
# git clone <REPO_URL> .  یا انتقال فایل‌ها
npm ci
cd shop-backend && npm ci && cd ..
```

### ساخت و اجرای سرویس‌ها با PM2
```
npm run build
pm2 start shop-backend/app.js --name api --env production
pm2 start npm --name web -- start
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```

نمونه `ecosystem.config.json`:
```
{
  "apps": [
    { "name": "api", "script": "shop-backend/app.js", "env": { "NODE_ENV": "production" } },
    { "name": "web", "script": "npm", "args": "start", "env": { "PORT": "3000" } }
  ]
}
```

### پیکربندی Nginx
گزینه A (ساده: همه درخواست‌ها به Next و خود Next `/api` را به 5000 می‌فرستد):
```
server {
  server_name your-domain.com www.your-domain.com;
  listen 80;
  listen [::]:80;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

گزینه B (توصیه‌شده: `/api` مستقیم به بک‌اند):
```
server {
  server_name your-domain.com www.your-domain.com;
  listen 80;
  listen [::]:80;
  location /api/ {
    proxy_pass http://127.0.0.1:5000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location /uploads/ {
    proxy_pass http://127.0.0.1:5000/uploads/;
    proxy_set_header Host $host;
  }
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

فعال‌سازی سایت:
```
sudo tee /etc/nginx/sites-available/my-shop2 >/dev/null <<'NGINX'
# یکی از کانفیگ‌های بالا را قرار دهید
NGINX
sudo ln -s /etc/nginx/sites-available/my-shop2 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### فعال‌سازی SSL با Certbot
```
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --redirect --email you@example.com --agree-tos --no-eff-email
```

### نکات امنیت و عملکرد
- مقدار `ALLOWED_ORIGINS` برابر دامنه تولید باشد.
- `JWT_SECRET` قوی و محرمانه باشد.
- مسیر `shop-backend/uploads` دسترسی نوشتن داشته باشد: `chown -R $USER:$USER shop-backend/uploads`
- فایروال:
```
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### دیتابیس و Seed
```
mongosh
use shop
db.createUser({ user: "shopuser", pwd: "StrongPass!", roles: ["readWrite"] })
```
اجرای seed در صورت نیاز:
```
node shop-backend/seed.js
```

### لاگ‌ها و مانیتورینگ
```
pm2 logs api
pm2 logs web
pm2 monit
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### به‌روزرسانی نسخه
```
git pull
npm ci
cd shop-backend && npm ci && cd ..
npm run build
pm2 reload all
```

### تست نهایی
- `curl http://127.0.0.1:5000/` باید "Shop Backend is running" بدهد.
- `curl http://127.0.0.1:5000/api/settings` پاسخ JSON بدهد.
- مرور `https://your-domain.com` بعد از SSL.
- تست پرداخت زرین‌پال (در صورت پیکربندی).



