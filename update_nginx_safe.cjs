const { Client } = require('ssh2');
const conn = new Client();
const fs = require('fs');

const config = {
  host: '206.238.196.33',
  port: 22,
  username: 'root',
  password: 'ASjsya%34wga'
};

const localFile = 'nginx_new.conf';
const remoteFile = '/tmp/nginx_new.conf';

conn.on('ready', () => {
  console.log('Client :: ready');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    console.log(`Uploading ${localFile}...`);
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) {
        console.error('Upload failed:', err);
        conn.end();
        return;
      }
      console.log('Upload successful.');
      
      const cmd = `
        cp /etc/nginx/sites-available/binarycent /etc/nginx/sites-available/binarycent.bak && \
        cp ${remoteFile} /etc/nginx/sites-available/binarycent && \
        nginx -t && \
        systemctl reload nginx && \
        echo "Nginx reloaded successfully."
      `;
      
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Command closed with code: ' + code);
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
  });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect(config);
