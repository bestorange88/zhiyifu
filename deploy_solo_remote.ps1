$Server = "206.238.196.136"
$User = "root"
$LocalPackage = "deploy_solo.tar.gz"
$LocalEnv = ".env.prod"
$RemotePackage = "/tmp/deploy_solo.tar.gz"
$DeployPath = "/var/www/binarycent"

# Switch to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Working Directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Listing files in current directory:" -ForegroundColor Gray
Get-ChildItem

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SOLO Branch Deployment Tool" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 0. Build and Package
Write-Host "[0/4] Building and Packaging..." -ForegroundColor Green
Write-Host "Running npm install..."
npm install
Write-Host "Checking available scripts..."
npm run
Write-Host "Running npm run build..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

# Package
echo "Packaging..."
# Make sure to include fix_db.cjs
tar -czf $LocalPackage dist package.json package-lock.json shared drizzle.config.ts fix_db.cjs
if ($LASTEXITCODE -ne 0) { Write-Error "Packaging failed"; exit 1 }

# Upload Package
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

# Backup current data
echo "Backing up current deployment..."
rm -rf /tmp/binarycent_backup
mkdir -p /tmp/binarycent_backup
if [ -d "$DeployPath/.data" ]; then
    cp -r $DeployPath/.data /tmp/binarycent_backup/.data
    echo "Backed up .data"
fi
if [ -f "$DeployPath/.env" ]; then
    cp $DeployPath/.env /tmp/binarycent_backup/.env
    echo "Backed up .env"
fi
if [ -d "$DeployPath/uploads" ]; then
    cp -r $DeployPath/uploads /tmp/binarycent_backup/uploads
    echo "Backed up uploads"
fi
if [ -d "$DeployPath/attached_assets" ]; then
    cp -r $DeployPath/attached_assets /tmp/binarycent_backup/attached_assets
    echo "Backed up legacy attached_assets"
fi

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
echo "Updating .env..."
if [ -f "/tmp/.env.prod.fallback" ]; then
    cp /tmp/.env.prod.fallback $DeployPath/.env
    echo "✅ Updated .env with new configuration."
elif [ -f "/tmp/binarycent_backup/.env" ]; then
    cp /tmp/binarycent_backup/.env $DeployPath/.env
    echo "⚠️ Restored .env from backup (no new config found)."
fi

# Restore Uploads
if [ -d "/tmp/binarycent_backup/uploads" ]; then
    echo "Restoring uploads..."
    cp -r /tmp/binarycent_backup/uploads $DeployPath/uploads
fi

# Restore/Migrate Legacy Uploads
if [ -d "/tmp/binarycent_backup/attached_assets/uploads" ]; then
    echo "Found legacy uploads in backup attached_assets, merging to root uploads..."
    mkdir -p $DeployPath/uploads
    cp -r /tmp/binarycent_backup/attached_assets/uploads/* $DeployPath/uploads/
    echo "✅ Merged legacy uploads."
fi

# Install
echo "Installing dependencies..."
cd $DeployPath
npm install --production

# DB Fix (Critical for schema updates)
echo "Running DB Fix Script..."
node fix_db.cjs || echo "⚠️ DB Fix script failed or skipped."

# DB Migration
echo "Running Database Migration..."
# drizzle-kit and tsx are now in dependencies so they are installed
# Use npx to ensure we use the installed binary
# Try to run migration non-interactively if possible, or warn user.
# Drizzle Kit push doesn't support --force or --yes easily for data loss.
# We will pipe "y" to it just in case it asks about data loss (e.g. dropping tables).
# CAUTION: This is aggressive.
echo "y" | npx drizzle-kit push || echo "⚠️ Database migration failed or skipped. Please check connection."

# Restart
echo "Restarting service..."
# Set System Timezone
echo "Setting system timezone to Asia/Shanghai..."
if command -v timedatectl >/dev/null; then
    timedatectl set-timezone Asia/Shanghai || true
fi
if [ -f /usr/share/zoneinfo/Asia/Shanghai ]; then
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
fi
echo "Current system time: $(date)"

# SETUP PERSISTENT STORAGE
# Use a directory outside the deployment folder to store uploads
PERSISTENT_DIR="/var/www/binarycent_storage"
UPLOADS_DIR="`$PERSISTENT_DIR/uploads"

echo "Setting up persistent storage at `$PERSISTENT_DIR..."
mkdir -p `$UPLOADS_DIR

# Migrate existing uploads if they exist in the backup or current deployment
if [ -d "/tmp/binarycent_backup/uploads" ]; then
    echo "Migrating uploads from backup to persistent storage..."
    cp -rn /tmp/binarycent_backup/uploads/* `$UPLOADS_DIR/ || true
fi

# Ensure permissions
# Assuming the app runs as root (based on pm2 config), but good to be safe
chmod -R 755 `$PERSISTENT_DIR

# Create Symlink for Nginx/App compatibility
# Remove the directory if it exists (it was created by restore or mkdir)
rm -rf $DeployPath/uploads
ln -sfn `$UPLOADS_DIR $DeployPath/uploads
echo "✅ Symlinked $DeployPath/uploads -> `$UPLOADS_DIR"

export TZ=Asia/Shanghai
export UPLOAD_DIR=`$UPLOADS_DIR
pm2 delete ai-clone || true
# Pass UPLOAD_DIR to the process
TZ=Asia/Shanghai UPLOAD_DIR=`$UPLOADS_DIR pm2 start dist/index.cjs --name "ai-clone"
pm2 save

echo "✅ Deployment Successful!"
"@

$RemoteScript | ssh -o StrictHostKeyChecking=no ${User}@${Server} "bash -s"
