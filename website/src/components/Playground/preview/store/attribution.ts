import {
  DevToolsManager,
  IdlingNetworkManager,
  LogoutManager,
  NetworkManager,
  SubscriptionManager,
  type ActionTypes,
  type Controller,
  type Manager,
} from '@data-client/react';

import type { LogEntry } from './actionLog';

/** The library's managers, by class: a production build minifies their
 * `constructor.name`. `console`: it (or a subclass) hands its controller to
 * the console (`__DC__`), whose calls it never makes itself */
const KNOWN: readonly {
  readonly cls: abstract new (...args: any) => Manager;
  readonly name: string;
  readonly console?: true;
}[] = [
  { cls: NetworkManager, name: 'NetworkManager' },
  { cls: IdlingNetworkManager, name: 'IdlingNetworkManager' },
  { cls: SubscriptionManager, name: 'SubscriptionManager' },
  { cls: DevToolsManager, name: 'DevToolsManager', console: true },
  { cls: LogoutManager, name: 'LogoutManager' },
];
const KNOWN_NAMES = new Set(KNOWN.map(known => known.name));
/** The library's name for `manager`, when it is one of the library's own
 * classes; a subclass is the code's, named for itself */
const libraryName = (manager: Manager) =>
  KNOWN.find(({ cls }) => manager.constructor === cls)?.name;
const sharesWithConsole = (manager: Manager) =>
  KNOWN.some(known => known.console && manager instanceof known.cls);

/** A manager every store has unless the code chooses otherwise, by the
 * name `managerNames` gave it */
export const isLibraryManager = (name: string) =>
  KNOWN_NAMES.has(baseName(name));

/** Whether a fetch it handles starts a request: a NetworkManager, the
 * library's or a subclass the code made of it */
export const startsRequests = (manager: Manager) =>
  manager instanceof NetworkManager;

/** Its class's name, without the `#2` a repeat gets */
export const baseName = (name: string) => name.replace(/ #\d+$/, '');

interface Stage {
  /** The manager's name (unique in its chain) */
  readonly id: string;
  /** Actions it dispatched */
  readonly sent: number;
  /** Actions it kept from the rest of the chain */
  readonly handled: number;
}

/** Who sent an action and who kept it from the rest of the chain */
type Attributed = Pick<LogEntry, 'origin' | 'consumedBy'>;

/** The stage before the chain: the app's own dispatches */
export const APP = 'the app';
/** Every stage a dispatch can start from, in order: the app, then the chain */
export const stagesOf = (chain: readonly string[]) => [APP, ...chain];
/** The stage that sent `entry`: a manager, or the app */
export const originOf = (entry: Attributed) => entry.origin ?? APP;

/** What the app and each manager of the chain, in order, did over
 * `entries` */
export function pipeline(
  chain: readonly string[],
  entries: readonly Attributed[],
): Stage[] {
  const stages = new Map(
    stagesOf(chain).map(id => [id, { id, sent: 0, handled: 0 }]),
  );
  for (const entry of entries) {
    const sender = stages.get(originOf(entry));
    if (sender) sender.sent++;
    const handler = entry.consumedBy && stages.get(entry.consumedBy);
    if (handler) handler.handled++;
  }
  return [...stages.values()];
}

/** Each way `entries` took (by type, sender, handler and whether it was
 * stored), with the first to take it and how many did */
export function routesOf(
  entries: readonly LogEntry[],
): { entry: LogEntry; n: number }[] {
  const seen = new Map<string, { entry: LogEntry; n: number }>();
  for (const entry of entries) {
    const { action, origin, consumedBy, store } = entry;
    const key = JSON.stringify([action.type, origin, consumedBy, !!store]);
    const route = seen.get(key);
    if (route) route.n++;
    else seen.set(key, { entry, n: 1 });
  }
  return [...seen.values()];
}

/** The chain to draw, once the store has managers */
export const shownChain = (managers: readonly string[] | undefined) =>
  managers?.length ? managers : undefined;

/** Whether `entry` is one `stage` took part in: those it sent, and (a
 * manager) those it kept from the rest of the chain */
export function byStage(stage: string) {
  return (entry: Attributed) =>
    originOf(entry) === stage || entry.consumedBy === stage;
}

/** What the Store inspector calls each manager of a chain: its class, with
 * `#2` and on when a chain holds several of one class */
export function managerNames(managers: readonly Manager[]): string[] {
  const seen = new Map<string, number>();
  return managers.map(manager => {
    const base = libraryName(manager) || manager.constructor?.name || 'Manager';
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
  /** The action each copy a middleware passed on was made from, so whoever
   * handles the copy is credited on the action the log recorded */
  readonly copies: WeakMap<ActionTypes, ActionTypes>;
}

/** `manager`, telling `attribution` while it calls its controller (what it
 * dispatches through `set`, `fetch`, `dispatch` …), and `consumed` with each
 * action its middleware returned without passing on (when its promise
 * settles, for async middleware), or with no one when it passes one on later.
 * Passing on a copy (`next({ ...action })`) counts while the middleware
 * runs. The prototype stays the manager, so `instanceof` checks still see
 * its class */
export function attributed(
  manager: Manager,
  name: string,
  attribution: Attribution,
  consumed: (action: ActionTypes, by?: string) => void,
): Manager {
  const tracked: Manager = Object.create(manager);
  // with `this` the manager, as DataProvider would call them
  if (manager.init) tracked.init = state => manager.init!(state);
  tracked.cleanup = () => manager.cleanup();
  const sends = !sharesWithConsole(manager);
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
        // one passed on in place of the action running (not besides it,
        // nor a copy it came from) stands for it
        const from = running.at(-1);
        if (
          from &&
          !passed.has(from) &&
          !copiedFrom(attribution, from, action)
        ) {
          passed.add(from);
          attribution.copies.set(action, from);
        }
        if (reported.has(action)) consumed(action);
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

/** `action`, then what it was copied from, and so on */
export function* lineage(
  { copies }: Attribution,
  action: ActionTypes,
): Generator<ActionTypes> {
  for (let a: ActionTypes | undefined = action; a; a = copies.get(a)) yield a;
}

/** Whether `ancestor` is `action`, or what it was copied from (linking a
 * copy to its ancestor would loop) */
function copiedFrom(
  attribution: Attribution,
  action: ActionTypes,
  ancestor: ActionTypes,
): boolean {
  for (const a of lineage(attribution, action)) if (a === ancestor) return true;
  return false;
}

type AnyFn = (...args: any[]) => any;

/** `controller`, whose every call runs as `name` dispatching */
function asDispatcher(
  controller: Controller,
  name: string,
  attribution: Attribution,
): Controller {
  const wrapped = new WeakMap<AnyFn, AnyFn>();
  return new Proxy(controller, {
    get(target, key) {
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      // the same function each read, until the controller's changes
      const cached = wrapped.get(value);
      if (cached) return cached;
      const asName = function (this: unknown, ...args: unknown[]) {
        const outer = attribution.dispatching;
        attribution.dispatching = name;
        try {
          return value.apply(target, args);
        } finally {
          attribution.dispatching = outer;
        }
      };
      wrapped.set(value, asName);
      return asName;
    },
  });
}

/** Who sent `entries` (the first, which started them) and the first
 * manager to keep one from the rest of the chain, leaving out the library's
 * managers, whose work every playground has, so the code's own stand out.
 * An action's path still says all */
export function notableAttribution(entries: readonly Attributed[]): Attributed {
  const notable = (name?: string) =>
    name && !isLibraryManager(name) ? name : undefined;
  return {
    origin: notable(entries[0]?.origin),
    consumedBy: entries.find(e => notable(e.consumedBy))?.consumedBy,
  };
}
