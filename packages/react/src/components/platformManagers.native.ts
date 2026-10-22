import type { Manager } from '@data-client/core';

import CommitGateManager from '../managers/CommitGateManager.js';

// a render React discards must share its gate with the render that commits
const gated = new WeakMap<Manager[], Manager[]>();

/** Expo Router loads the root layout lazily, so fetches can settle before DataProvider mounts */
export default function platformManagers(managers: Manager[]): Manager[] {
  if (managers.some(manager => manager instanceof CommitGateManager))
    return managers;
  let withGate = gated.get(managers);
  if (!withGate) {
    withGate = [new CommitGateManager(), ...managers];
    gated.set(managers, withGate);
  }
  return withGate;
}
