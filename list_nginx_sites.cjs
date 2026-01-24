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
  conn.exec('ls -F /etc/nginx/sites-enabled/', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    });
  });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect(config);
