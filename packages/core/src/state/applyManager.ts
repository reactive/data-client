import { Middleware } from '@rest-hooks/use-enhanced-reducer';

import { Manager } from '../types.js';
import type Controller from '../controller/Controller.js';

export default function applyManager(
  managers: Manager[],
  controller: Controller,
): Middleware[] {
  return managers.map(manager => {
    const middleware = manager.getMiddleware();
    return ({ dispatch, getState }) => {
      (controller as any).dispatch = dispatch;
      return middleware({ controller, dispatch, getState });
    };
  });
}
