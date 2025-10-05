param(
  [Parameter(Mandatory=$true)][string]$ServerUser,
  [Parameter(Mandatory=$true)][string]$ServerHost,
  [string]$RemoteDir="/var/www",
  [string]$ProjectDir=".."
)

$ErrorActionPreference = "Stop"

Write-Host "Zipping project..."
$zipPath = Join-Path $PWD "my-shop2.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $ProjectDir "*") -DestinationPath $zipPath

Write-Host "Uploading to $ServerUser@$ServerHost:$RemoteDir ..."
scp $zipPath "$ServerUser@$ServerHost:$RemoteDir/"

Write-Host "Unzipping on server..."
ssh "$ServerUser@$ServerHost" "sudo mkdir -p $RemoteDir/my-shop2 && sudo chown \$USER:\$USER $RemoteDir/my-shop2 && unzip -o $RemoteDir/my-shop2.zip -d $RemoteDir/my-shop2"

Write-Host "Done. Next: SSH and run setup-server.sh"


