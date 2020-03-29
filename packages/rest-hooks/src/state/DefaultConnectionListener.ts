import { ConnectionListener } from './ConnectionListener';

export default class DefaultConnectionListener implements ConnectionListener {
  isOnline() {
    if (navigator.onLine !== undefined) {
      return navigator.onLine;
    }
    return true;
  }

  addOnlineListener(handler: () => void) {
    if (typeof addEventListener === 'function')
      addEventListener('online', handler);
  }

  removeOnlineListener(handler: () => void) {
    if (typeof removeEventListener === 'function')
      removeEventListener('online', handler);
  }

  addOfflineListener(handler: () => void) {
    if (typeof addEventListener === 'function')
      addEventListener('offline', handler);
  }

  removeOfflineListener(handler: () => void) {
    if (typeof removeEventListener === 'function')
      removeEventListener('offline', handler);
  }
}
