const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '206.238.196.33',
  port: 22,
  username: 'root',
  password: 'ASjsya%34wga'
};

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('pm2 list', (err, stream) => {
    if (err) {
        // PM2 might not be in path, try ps aux
        console.log('PM2 check failed or not found, trying ps aux');
        conn.exec('ps aux | grep node', (err2, stream2) => {
             if (err2) throw err2;
             stream2.pipe(process.stdout);
             stream2.on('close', () => conn.end());
        });
        return;
    }
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    });
  });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect(config);
