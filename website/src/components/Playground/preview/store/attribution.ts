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
 * `constructor.name`. `console`: it hands its controller to the console
 * (`__DC__`), whose calls it never makes itself */
const KNOWN: readonly {
  readonly cls: abstract new (...args: any) => Manager;
  readonly name: string;
  readonly console?: true;
}[] = [
  { cls: NetworkManager, name: 'NetworkManager' },
  { cls: SubscriptionManager, name: 'SubscriptionManager' },
  { cls: DevToolsManager, name: 'DevToolsManager', console: true },
  { cls: LogoutManager, name: 'LogoutManager' },
];
const knownOf = (manager: Manager) =>
  KNOWN.find(({ cls }) => manager instanceof cls);

/** A manager every store has unless the code chooses otherwise, by the
 * name `managerNames` gave it */
export const isLibraryManager = (name: string) =>
  KNOWN.some(known => baseName(name) === known.name);

/** Its class's name, without the `#2` a repeat gets */
const baseName = (name: string) => name.replace(/ #\d+$/, '');

export interface ManagerRow {
  /** Its name (unique in its chain) */
  readonly id: string;
  /** Where it is in the chain, from 1 */
  readonly position: number;
  /** Actions it dispatched */
  readonly sent: number;
  /** Actions it kept from the rest of the chain */
  readonly handled: number;
  /** When it last did either */
  readonly last?: number;
}

/** The chain's managers in order, with what each did over `entries` up to
 * `until` (all of them when it's missing) */
export function managerRows(
  managers: readonly string[],
  entries: readonly {
    seq: number;
    at: number;
    origin?: string;
    consumedBy?: string;
  }[],
  until = Infinity,
): ManagerRow[] {
  const rows = new Map(
    managers.map((id, i) => [
      id,
      {
        id,
        position: i + 1,
        sent: 0,
        handled: 0,
        last: undefined as number | undefined,
      },
    ]),
  );
  for (const { seq, at, origin, consumedBy } of entries) {
    if (seq > until) break;
    const sender = origin && rows.get(origin);
    if (sender) {
      sender.sent++;
      sender.last = at;
    }
    const handler = consumedBy && rows.get(consumedBy);
    if (handler) {
      handler.handled++;
      handler.last = at;
    }
  }
  return [...rows.values()];
}

/** What the Store inspector calls each manager of a chain: its class, with
 * `#2` and on when a chain holds several of one class */
export function managerNames(managers: readonly Manager[]): string[] {
  const seen = new Map<string, number>();
  return managers.map(manager => {
    const base =
      knownOf(manager)?.name || manager.constructor?.name || 'Manager';
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
 * settles, for async middleware), or `false` when one it did pass on later.
 * Passing on a copy (`next({ ...action })`) counts while the middleware
 * runs. The prototype stays the manager, so `instanceof` checks still see
 * its class */
export function attributed(
  manager: Manager,
  name: string,
  attribution: Attribution,
  consumed: (action: ActionTypes, by: string | false) => void,
): Manager {
  const tracked: Manager = Object.create(manager);
  // with `this` the manager, as DataProvider would call them
  if (manager.init) tracked.init = state => manager.init!(state);
  tracked.cleanup = () => manager.cleanup();
  const sends = !knownOf(manager)?.console;
  tracked.middleware = controller => {
    const own =
      sends ? asDispatcher(controller, name, attribution) : controller;
    const withController = manager.middleware.call(manager, own);
    return next => {
      const passed = new WeakSet<object>();
      const reported = new WeakSet<object>();
      /** The actions this middleware is running for, innermost last */
      const running: ActionTypes[] = [];
      const dispatch = withController(action => {
        passed.add(action);
        // a copy passed on stands for the action it was made from
        const from = running.at(-1);
        if (from) passed.add(from);
        if (reported.has(action)) consumed(action, false);
        return next(action);
      });
      return action => {
        const check = () => {
          if (passed.has(action)) return;
          reported.add(action);
          consumed(action, name);
        };
        running.push(action);
        let result;
        try {
          result = dispatch(action);
        } finally {
          running.pop();
        }
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

/** Who sent `entries` (the first, which started them) and the first
 * manager to keep one from the rest of the chain, leaving out the library's
 * managers, whose work every playground has, so the code's own stand out,
 * and `except` (whose actions are listed). An action's detail still says
 * all */
export function notableAttribution(
  entries: readonly { origin?: string; consumedBy?: string }[],
  except?: string,
): { origin?: string; consumedBy?: string } {
  const notable = (name?: string) =>
    name && name !== except && !isLibraryManager(name) ? name : undefined;
  return {
    origin: notable(entries[0]?.origin),
    consumedBy: entries.map(e => notable(e.consumedBy)).find(Boolean),
  };
}
