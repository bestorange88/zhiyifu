const { Client } = require('ssh2');
const conn = new Client();

const config = {
  host: '206.238.196.136',
  port: 22,
  username: 'root',
  password: 'Azhdsbh%dsu823j',
  readyTimeout: 20000, // 20 seconds
  debug: (msg) => console.log('DEBUG:', msg)
};

console.log('Connecting to ' + config.host + '...');

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('node -v', (err, stream) => {
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
