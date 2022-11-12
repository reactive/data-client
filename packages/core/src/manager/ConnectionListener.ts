export default interface ConnectionListener {
  isOnline: () => boolean;
  addOnlineListener: (handler: () => void) => void;
  removeOnlineListener: (handler: () => void) => void;
  addOfflineListener: (handler: () => void) => void;
  removeOfflineListener: (handler: () => void) => void;
}
