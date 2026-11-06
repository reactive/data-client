import type Controller from '../controller/Controller.js';
import { Manager } from '../types.js';

/** Returns an Effect that starts `managers` and returns their cleanup.
 *
 * `init()` gets the store's current state, so a Manager resumed after `cleanup()` sees what the store
 * applied while it was paused.
 */
export default function initManager(
  managers: Manager[],
  controller: Controller,
) {
  return () => {
    const state = controller.getState();
    managers.forEach(manager => {
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
