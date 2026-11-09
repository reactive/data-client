import { NetworkManager } from '@data-client/react';

/** Logs how long the store lived, for support tickets. */
export default class AuditNetworkManager extends NetworkManager {
  protected startedAt = Date.now();

  cleanup() {
    super.cleanup();
    const ended = (this as any).cleanupDate ?? Date.now();
    console.info(`data store lived ${ended - this.startedAt}ms`);
  }
}
