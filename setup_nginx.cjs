const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '206.238.196.136',
  port: 22,
  username: 'root',
  password: 'Azhdsbh%dsu823j'
};

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
  
  const cmd = `
    # Install Nginx if not present (simplified check)
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
    
    echo "Nginx configuration updated for ${domain}"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect(config);
