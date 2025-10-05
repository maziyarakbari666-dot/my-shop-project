## Deployment Helper

Steps:

1. Upload project from Windows:
```bash
powershell -ExecutionPolicy Bypass -File deploy/upload.ps1 -ServerUser <user> -ServerHost 89.32.251.74 -ProjectDir .
```

2. SSH to server and prepare envs:
```bash
ssh <user>@89.32.251.74
cd /var/www/my-shop2
bash deploy/create-envs.sh 89.32.251.74
```

3. Bootstrap and run services (as root):
```bash
sudo bash deploy/setup-server.sh --with-mongo
```

4. Install Nginx site:
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/my-shop2
sudo ln -sf /etc/nginx/sites-available/my-shop2 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

5. Verify:
```bash
curl http://127.0.0.1:5000/
curl http://127.0.0.1:3000/
pm2 status
```


