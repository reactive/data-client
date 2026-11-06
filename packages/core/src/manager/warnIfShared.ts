import type Controller from '../controller/Controller.js';
import type { Manager } from '../types.js';

/** Development only: the store each Manager instance last started (`init()` ran) with */
const startedWith = new WeakMap<Manager, Controller>();
// once per page: a shared array would otherwise warn for every Manager in it
let warned = false;

/** Warns when a Manager instance that started with one store is used by another */
export function warnIfShared(manager: Manager, controller: Controller) {
  const started = startedWith.get(manager);
  if (started === undefined || started === controller || warned) return;
  warned = true;
  console.warn(
    `${manager.constructor.name} is used by more than one store, so state about the first store leaks into the next one.
Pass managers as a function, so each store gets new instances: managers={() => [...getDefaultManagers(), new MyManager()]}
See https://dataclient.io/docs/api/Manager#lifetimes`,
  );
}

/** Records that `manager` started with `controller`, warning first if it started with another store */
export function markStarted(manager: Manager, controller: Controller) {
  warnIfShared(manager, controller);
  startedWith.set(manager, controller);
}
