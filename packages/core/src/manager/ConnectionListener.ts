/** Listens to online/offline events for triggering re-fetches on reconnect.
 *
 * Implement this interface to provide custom connectivity detection
 * (e.g., for React Native or Node.js environments).
 *
 * @see https://dataclient.io/docs/api/PollingSubscription
 */
export default interface ConnectionListener {
  /** Returns whether the client is currently connected to the network. */
  isOnline: () => boolean;
  /** Register a handler to be called when the client comes back online. */
  addOnlineListener: (handler: () => void) => void;
  /** Remove a previously registered online handler. */
  removeOnlineListener: (handler: () => void) => void;
  /** Register a handler to be called when the client goes offline. */
  addOfflineListener: (handler: () => void) => void;
  /** Remove a previously registered offline handler. */
  removeOfflineListener: (handler: () => void) => void;
}
