const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '206.238.196.136',
  port: 22,
  username: 'root',
  password: 'Azhdsbh%dsu823j'
};

console.log('Connecting to ' + config.host + '...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const cmd = `
    set -e
    
    echo "Updating system..."
    apt-get update
    
    echo "Installing firewall (ufw) and certbot..."
    apt-get install -y ufw certbot python3-certbot-nginx

    echo "Configuring firewall..."
    # Reset ufw to default
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (CRITICAL)
    ufw allow 22/tcp
    ufw allow ssh
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 'Nginx Full'
    
    # Enable firewall
    echo "y" | ufw enable
    
    echo "Firewall status:"
    ufw status
    
    echo "Obtaining SSL certificate and configuring Nginx..."
    # Attempt to get certificate and auto-configure redirect
    # --redirect: Force HTTPS
    # --non-interactive: Run without user input
    # --agree-tos: Agree to Terms of Service
    # -m: Email for renewal warnings
    certbot --nginx -d zhiyifu.net -d www.zhiyifu.net --non-interactive --agree-tos -m admin@zhiyifu.net --redirect
    
    echo "Reloading Nginx..."
    systemctl reload nginx
    
    echo "HTTPS setup complete!"
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
