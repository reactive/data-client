import type Controller from '../controller/Controller.js';
import { Manager, State } from '../types.js';
import { markStarted } from './warnIfShared.js';

/** Returns an Effect that starts `managers` and returns their cleanup.
 *
 * `init()` gets the store's current state, so a Manager resumed after `cleanup()` sees what the store
 * applied while it was paused.
 */
export default function initManager(
  managers: Manager[],
  controller: Controller,
  /** @deprecated Ignored: `init()` gets `controller.getState()` */
  initialState?: State<unknown>,
) {
  return () => {
    const state = controller.getState();
    managers.forEach(manager => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production')
        markStarted(manager, controller);
      manager.init?.(state);
    });
    controller.gcPolicy.init(controller);
    return () => {
      managers.forEach(manager => {
        manager.cleanup();
      });
      controller.gcPolicy.cleanup();
    };
  };
}
