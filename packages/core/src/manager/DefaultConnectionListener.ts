import ConnectionListener from './ConnectionListener.js';

export class BrowserConnectionListener implements ConnectionListener {
  isOnline() {
    if (navigator.onLine !== undefined) {
      return navigator.onLine;
    }
    return true;
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
    /* istanbul ignore next */
    return true;
  }

  addOnlineListener() {}

  removeOnlineListener() {}

  addOfflineListener() {}

  removeOfflineListener() {}
}

let DefaultConnectionListener: { new (): ConnectionListener };
/* istanbul ignore if */
if (
  typeof navigator !== 'undefined' &&
  typeof addEventListener === 'function'
) {
  DefaultConnectionListener = BrowserConnectionListener;
} else {
  /* istanbul ignore next */
  DefaultConnectionListener = AlwaysOnlineConnectionListener;
}
export default DefaultConnectionListener;
