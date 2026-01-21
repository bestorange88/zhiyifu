import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.zhiyifu.app',
  appName: '云智医服',
  webDir: 'dist/public',
  server: {
    url: 'https://zhiyifu.net',
    cleartext: true
  }
};

export default config;
