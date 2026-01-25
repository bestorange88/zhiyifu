$Server = "206.238.196.136"
$User = "root"
$LocalScript = "script/fix_vip_status.ts"
$RemotePath = "/var/www/binarycent/script/fix_vip_status.ts"

Write-Host "Uploading fix script..." -ForegroundColor Cyan
scp $LocalScript ${User}@${Server}:${RemotePath}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Running fix script on server..." -ForegroundColor Cyan
    ssh -t ${User}@${Server} "cd /var/www/binarycent && export TZ=Asia/Shanghai && npx tsx script/fix_vip_status.ts"
} else {
    Write-Error "Failed to upload script."
}
