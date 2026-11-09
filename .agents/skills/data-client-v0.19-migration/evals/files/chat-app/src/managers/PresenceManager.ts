import type { Manager } from '@data-client/react';

/** Tells the server this tab is open while the app is mounted. */
export default class PresenceManager implements Manager {
  protected heartbeat?: ReturnType<typeof setInterval>;

  init() {
    this.heartbeat = setInterval(() => {
      navigator.sendBeacon('https://chat.example.com/presence');
    }, 30_000);
  }

  cleanup() {
    clearInterval(this.heartbeat);
  }
}
