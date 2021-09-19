import { Middleware } from '@rest-hooks/use-enhanced-reducer';
import { Manager } from '@rest-hooks/core/types';
import type Controller from '@rest-hooks/core/controller/Controller';

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
