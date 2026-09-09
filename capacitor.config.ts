import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowtracker.app',
  appName: 'Shadow Tracker',
  webDir: 'out',
  backgroundColor: '#030603',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Default zoom is 100% (no zoom meta overrides needed here)
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#6366F1',
      sound: 'default',
    },
  },
};

export default config;
