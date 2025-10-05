param(
  [string]$ProjectDir = ".",
  [string]$PublicHost = "89.32.251.74",
  [string]$NodeVersion = "lts",
  [switch]$InstallMongo
)

$ErrorActionPreference = "Stop"

function Require-Admin {
  $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "این اسکریپت باید با PowerShell (Run as Administrator) اجرا شود."
  }
}

function Ensure-Choco {
  if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "نصب Chocolatey..." -ForegroundColor Cyan
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
  } else {
    Write-Host "Chocolatey از قبل موجود است." -ForegroundColor Yellow
  }
}

function Ensure-Node {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "نصب Node.js (LTS)..." -ForegroundColor Cyan
    choco install nodejs-lts -y --no-progress
  } else {
    Write-Host "Node.js از قبل موجود است." -ForegroundColor Yellow
  }
}

function Ensure-Mongo {
  if ($InstallMongo) {
    if (-not (Get-Service -Name MongoDB* -ErrorAction SilentlyContinue)) {
      Write-Host "نصب MongoDB Community..." -ForegroundColor Cyan
      choco install mongodb -y --no-progress
    }
  }
}

function Ensure-PM2 {
  if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "نصب PM2 و سرویس ویندوز PM2..." -ForegroundColor Cyan
    npm i -g pm2 pm2-windows-service
  } else {
    Write-Host "PM2 از قبل موجود است." -ForegroundColor Yellow
  }
}

function Write-Envs($proj, $host) {
  Write-Host "ایجاد فایل‌های env بر اساس هاست: $host" -ForegroundColor Cyan
  Set-Location $proj
  @" 
PORT=3000
NEXT_PUBLIC_API_URL=http://$host:5000
"@ | Out-File -FilePath ".env.production" -Encoding UTF8 -Force

  if (-not (Test-Path "shop-backend")) { New-Item -ItemType Directory -Path "shop-backend" | Out-Null }
  @" 
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shop
ALLOWED_ORIGINS=http://$host,http://$host:3000
JWT_SECRET=$( [guid]::NewGuid().ToString('N') )
ENABLE_JOBS=true
"@ | Out-File -FilePath "shop-backend/.env" -Encoding UTF8 -Force
}

function Install-Dependencies($proj) {
  Write-Host "نصب وابستگی‌ها..." -ForegroundColor Cyan
  Set-Location $proj
  if (Test-Path "package-lock.json") { npm ci } else { npm install }
  if (Test-Path "shop-backend/package.json") {
    Push-Location "shop-backend"
    if (Test-Path "package-lock.json") { npm ci } else { npm install }
    Pop-Location
  }
}

function Build-Frontend($proj) {
  Write-Host "ساخت فرانت‌اند..." -ForegroundColor Cyan
  Set-Location $proj
  npm run build
}

function Start-Services {
  Write-Host "راه‌اندازی سرویس‌ها با PM2..." -ForegroundColor Cyan
  pm2 start shop-backend/app.js --name api --env production
  pm2 start npm --name web -- start
  pm2 save
  Write-Host "برای اجرا پس از ریبوت، سرویس Windows PM2 را نصب کنید:" -ForegroundColor Yellow
  Write-Host "pm2-service-install" -ForegroundColor Yellow
}

function Open-Firewall {
  Write-Host "باز کردن فایروال برای پورت‌های 3000 و 5000..." -ForegroundColor Cyan
  New-NetFirewallRule -DisplayName "my-shop2-frontend-3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -ErrorAction SilentlyContinue | Out-Null
  New-NetFirewallRule -DisplayName "my-shop2-backend-5000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -ErrorAction SilentlyContinue | Out-Null
}

# MAIN
Require-Admin
Ensure-Choco
Ensure-Node
Ensure-Mongo
Ensure-PM2
Write-Envs -proj $ProjectDir -host $PublicHost
Install-Dependencies -proj $ProjectDir
Build-Frontend -proj $ProjectDir
Start-Services
Open-Firewall

Write-Host "انجام شد. اکنون از سیستم خود به آدرس‌های زیر تست کنید:" -ForegroundColor Green
Write-Host "Frontend:  http://$PublicHost:3000" -ForegroundColor Green
Write-Host "Backend:   http://$PublicHost:5000" -ForegroundColor Green


