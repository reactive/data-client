import { ConnectionListener } from './ConnectionListener';

export class BrowserConnectionListener implements ConnectionListener {
  isOnline() {
    return navigator.onLine;
  }

  addOnlineListener(handler: () => void) {
    addEventListener('online', handler);
  }

  removeOnlineListener(handler: () => void) {
    removeEventListener('online', handler);
  }

  addOfflineListener(handler: () => void) {
    addEventListener('offline', handler);
  }

  removeOfflineListener(handler: () => void) {
    removeEventListener('offline', handler);
  }
}

export class AlwaysOnlineConnectionListener implements ConnectionListener {
  isOnline() {
    return true;
  }

  addOnlineListener() {}

  removeOnlineListener() {}

  addOfflineListener() {}

  removeOfflineListener() {}
}

let DefaultConnectionListener: { new (): ConnectionListener };
if (navigator.onLine !== undefined && typeof addEventListener === 'function') {
  DefaultConnectionListener = BrowserConnectionListener;
} else {
  DefaultConnectionListener = AlwaysOnlineConnectionListener;
}
export default DefaultConnectionListener;
