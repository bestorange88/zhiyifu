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
  // Stop and delete process 0 (old aiclone), restart process 1 (new ai-clone), save pm2
  const cmd = 'pm2 stop 0 || true && pm2 delete 0 || true && pm2 restart ai-clone && pm2 save';
  
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
