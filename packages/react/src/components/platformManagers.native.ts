import type { Manager } from '@data-client/core';

import CommitGateManager from '../managers/CommitGateManager.js';

/** Expo Router loads the root layout lazily, so fetches can settle before DataProvider mounts */
export default function platformManagers(managers: Manager[]): Manager[] {
  return [new CommitGateManager(), ...managers];
}
