import {
  DevToolsManager,
  LogoutManager,
  NetworkManager,
  SubscriptionManager,
  type ActionTypes,
  type Controller,
  type Manager,
} from '@data-client/react';

/** The library's managers, by class: a production build minifies their
 * `constructor.name` */
const KNOWN: readonly [abstract new (...args: any) => Manager, string][] = [
  [NetworkManager, 'NetworkManager'],
  [SubscriptionManager, 'SubscriptionManager'],
  [DevToolsManager, 'DevToolsManager'],
  [LogoutManager, 'LogoutManager'],
];

/** What the Store inspector calls each manager of a chain: its class, with
 * `#2` and on when a chain holds several of one class */
export function managerNames(managers: readonly Manager[]): string[] {
  const seen = new Map<string, number>();
  return managers.map(manager => {
    const base =
      KNOWN.find(([cls]) => manager instanceof cls)?.[1] ||
      manager.constructor?.name ||
      'Manager';
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n > 1 ? `${base} #${n}` : base;
  });
}

export interface Attribution {
  /** Who is dispatching right now: the manager whose controller call is on
   * the stack. The log's head reads it as each action arrives, and clears
   * it, so what else that dispatch sets off isn't credited to it too */
  dispatching?: string;
}

/** `manager`, telling `attribution` while it calls its controller (what it
 * dispatches through `set`, `fetch`, `dispatch` …), and `consumed` with each
 * action its middleware returned without passing on (when its promise
 * settles, for async middleware). The prototype stays the manager, so
 * `instanceof` checks still see its class */
export function attributed(
  manager: Manager,
  name: string,
  attribution: Attribution,
  consumed: (action: ActionTypes) => void,
): Manager {
  const tracked: Manager = Object.create(manager);
  // with `this` the manager, as DataProvider would call them
  tracked.init = manager.init && (state => manager.init?.(state));
  tracked.cleanup = () => manager.cleanup();
  const controllers = new WeakMap<Controller, Controller>();
  tracked.middleware = controller => {
    let own = controllers.get(controller);
    if (!own)
      controllers.set(
        controller,
        (own = asDispatcher(controller, name, attribution)),
      );
    const withController = manager.middleware.call(manager, own);
    return next => {
      const passed = new WeakSet<object>();
      const dispatch = withController(action => {
        passed.add(action);
        return next(action);
      });
      return action => {
        const check = () => {
          if (!passed.has(action)) consumed(action);
        };
        const result = dispatch(action);
        if (result instanceof Promise) result.then(check, check);
        else check();
        return result;
      };
    };
  };
  return tracked;
}

type AnyFn = (...args: any[]) => any;

/** `controller`, whose every call runs as `name` dispatching */
function asDispatcher(
  controller: Controller,
  name: string,
  attribution: Attribution,
): Controller {
  const wrapped = new Map<PropertyKey, [AnyFn, AnyFn]>();
  return new Proxy(controller, {
    get(target, key) {
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      // the same function each read, until the controller's changes
      const cached = wrapped.get(key);
      if (cached && cached[0] === value) return cached[1];
      const fn = function (this: unknown, ...args: unknown[]) {
        const outer = attribution.dispatching;
        attribution.dispatching = name;
        try {
          return value.apply(target, args);
        } finally {
          attribution.dispatching = outer;
        }
      };
      wrapped.set(key, [value, fn]);
      return fn;
    },
  });
}
