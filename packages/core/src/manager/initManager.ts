import type Controller from '../controller/Controller.js';
import { Manager, State } from '../types.js';

export default function initManager(
  managers: Manager[],
  controller: Controller,
  initialState: State<unknown>,
) {
  return () => {
    managers.forEach(manager => {
      manager.init?.(initialState);
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
