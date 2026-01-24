$Server = "206.238.196.136"
$User = "root"
$LocalScript = "verify_solo.cjs"
$RemoteScript = "/tmp/verify_solo.cjs"

Write-Host "Uploading verification script..."
scp $LocalScript ${User}@${Server}:${RemoteScript}

Write-Host "Running verification on server..."
ssh -o StrictHostKeyChecking=no ${User}@${Server} "cd /var/www/binarycent && node $RemoteScript"
