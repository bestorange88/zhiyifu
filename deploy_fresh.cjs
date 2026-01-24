const { Client } = require('ssh2');
const conn = new Client();
const fs = require('fs');
const path = require('path');

const config = {
  host: '206.238.196.136',
  port: 22,
  username: 'root',
  password: 'Azhdsbh%dsu823j'
};

const localFile = 'deploy_package.tar.gz';
const remoteFile = '/tmp/deploy_package.tar.gz';
const deployPath = '/var/www/binarycent';

const domain = 'zhiyifu.net';
const nginxConfig = `
server {
    listen 80;
    server_name ${domain} www.${domain};

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
`;

console.log('Connecting to ' + config.host + '...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log(`Uploading ${localFile} to ${remoteFile}...`);
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) {
        console.error('Upload failed:', err);
        conn.end();
        return;
      }
      console.log('Upload successful.');
      deploy();
    });
  });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect(config);

function deploy() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${deployPath}_bk_${timestamp}`;
  
  const cmd = `
    set -e
    echo "Starting FRESH deployment..."
    
    # Check if node and npm exist
    echo "Node version:"
    node -v
    echo "NPM version:"
    npm -v
    
    # Backup existing if it exists
    if [ -d "${deployPath}" ]; then
      echo "Backing up ${deployPath} to ${backupPath}..."
      cp -r ${deployPath} ${backupPath}
      echo "Cleaning up existing directory for fresh install..."
      rm -rf ${deployPath}
    fi
    
    echo "Creating ${deployPath}..."
    mkdir -p ${deployPath}
    
    # Extract
    echo "Extracting package..."
    tar -xzf ${remoteFile} -C ${deployPath}
    
    # Install dependencies
    echo "Installing dependencies (Clean Install)..."
    cd ${deployPath}
    # Remove node_modules just in case (though we just cleaned the dir)
    rm -rf node_modules
    npm install --production
    
    # Check for PM2
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 not found, installing..."
        npm install -g pm2
    fi
    
    # Manage PM2 Process
    echo "Managing process with PM2..."
    # Delete existing process to be fresh
    pm2 delete ai-clone || true
    
    echo "Starting ai-clone..."
    pm2 start dist/index.cjs --name "ai-clone"
    
    pm2 save
    
    # Nginx Configuration
    echo "Configuring Nginx..."
    # Install Nginx if not present
    if ! command -v nginx &> /dev/null; then
        apt-get update && apt-get install -y nginx
    fi

    # Write config file
    echo "${nginxConfig.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > /etc/nginx/sites-available/${domain}

    # Enable site
    ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/

    # Test configuration
    nginx -t

    # Reload Nginx
    systemctl reload nginx
    
    echo "Deployment complete!"
  `;
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
        console.error('Exec error:', err);
        conn.end();
        return;
    }
    stream.on('close', (code, signal) => {
      console.log('Deployment closed with code: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}
