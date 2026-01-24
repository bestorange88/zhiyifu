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
    echo "Starting deployment..."
    
    # Check if node and npm exist
    node -v
    npm -v
    
    # Backup existing
    if [ -d "${deployPath}" ]; then
      echo "Backing up ${deployPath} to ${backupPath}..."
      cp -r ${deployPath} ${backupPath}
    else
      echo "Creating ${deployPath}..."
      mkdir -p ${deployPath}
    fi
    
    # Extract
    echo "Extracting package..."
    tar -xzf ${remoteFile} -C ${deployPath} --overwrite
    
    # Install dependencies
    echo "Installing dependencies..."
    cd ${deployPath}
    npm install --production
    
    # Check for PM2
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 not found, installing..."
        npm install -g pm2
    fi
    
    # Start/Restart
    echo "Managing process with PM2..."
    if pm2 describe ai-clone > /dev/null; then
        echo "Reloading ai-clone..."
        pm2 reload ai-clone
    else
        echo "Starting ai-clone..."
        pm2 start dist/index.cjs --name "ai-clone"
    fi
    
    pm2 save
    
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
