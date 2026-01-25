$Server = "206.238.196.136"
$User = "root"
$LocalScript = "script/debug_vip_details.ts"
$RemotePath = "/var/www/binarycent/script/debug_vip_details.ts"

Write-Host "Uploading debug script..." -ForegroundColor Cyan
scp $LocalScript ${User}@${Server}:${RemotePath}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Running debug script on server..." -ForegroundColor Cyan
    ssh -t ${User}@${Server} "cd /var/www/binarycent && export TZ=Asia/Shanghai && npx tsx script/debug_vip_details.ts"
} else {
    Write-Error "Failed to upload script."
}
