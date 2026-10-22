import { NetworkManager } from '@data-client/core';
import type { Manager } from '@data-client/core';

import CommitGateManager from '../managers/CommitGateManager.js';

// a render React discards must share its gate with the render that commits;
// keyed on the instance that owns the fetch, since the array can be new each render
const gates = new WeakMap<Manager, CommitGateManager>();

/** Fetches can settle before DataProvider mounts, as when something outside it suspends */
export default function platformManagers(managers: Manager[]): Manager[] {
  if (managers.some(manager => manager instanceof CommitGateManager))
    return managers;
  const owner =
    managers.find(manager => manager instanceof NetworkManager) ?? managers[0];
  let gate = gates.get(owner);
  if (!gate) gates.set(owner, (gate = new CommitGateManager()));
  return [gate, ...managers];
}
