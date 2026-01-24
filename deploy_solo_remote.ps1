$Server = "206.238.196.136"
$User = "root"
$LocalPackage = "deploy_solo.tar.gz"
$LocalEnv = ".env.prod"
$RemotePackage = "/tmp/deploy_solo.tar.gz"
$DeployPath = "/var/www/binarycent"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SOLO Branch Deployment Tool" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 0. Build and Package
Write-Host "[0/4] Building and Packaging..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

tar -czf $LocalPackage dist package.json package-lock.json
if ($LASTEXITCODE -ne 0) { Write-Error "Packaging failed"; exit 1 }

# 1. Upload Package
Write-Host "[1/4] Uploading package..." -ForegroundColor Green
scp $LocalPackage ${User}@${Server}:${RemotePackage}
if ($LASTEXITCODE -ne 0) { Write-Error "Package upload failed"; exit 1 }

# 2. Upload Env (Fallback)
Write-Host "[2/4] Uploading env config..." -ForegroundColor Green
scp $LocalEnv ${User}@${Server}:/tmp/.env.prod.fallback

# 3. Remote Execution
Write-Host "[3/4] Executing remote deployment..." -ForegroundColor Green
$RemoteScript = @"
set -e
echo "Starting deployment..."

# Clean target (it might be empty or partial)
mkdir -p $DeployPath
# Don't rm -rf everything if we are restoring, but we need to ensure clean code.
# Since we have backup in /tmp/binarycent_backup, we can clean.
rm -rf $DeployPath/*

# Extract
echo "Extracting package..."
tar -xzf $RemotePackage -C $DeployPath

# Restore Data
echo "Restoring data..."
if [ -d "/tmp/binarycent_backup/.data" ]; then
    echo "Restoring .data from backup..."
    cp -r /tmp/binarycent_backup/.data $DeployPath/.data
else
    echo "⚠️ No data backup found in /tmp/binarycent_backup. Checking for existing .data..."
fi

# Restore Env
echo "Restoring .env..."
if [ -f "/tmp/binarycent_backup/.env" ]; then
    cp /tmp/binarycent_backup/.env $DeployPath/.env
    echo "Restored .env from backup."
else
    echo "⚠️ No .env backup found. Using fallback..."
    cp /tmp/.env.prod.fallback $DeployPath/.env
fi

# Restore Uploads
if [ -d "/tmp/binarycent_backup/uploads" ]; then
    echo "Restoring uploads..."
    cp -r /tmp/binarycent_backup/uploads $DeployPath/uploads
fi

# Install
echo "Installing dependencies..."
cd $DeployPath
npm install --production

# Restart
echo "Restarting service..."
pm2 delete ai-clone || true
pm2 start dist/index.cjs --name "ai-clone"
pm2 save

echo "✅ Deployment Successful!"
"@

$RemoteScript | ssh -o StrictHostKeyChecking=no ${User}@${Server} "bash -s"
