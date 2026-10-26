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
/** The library's name for `manager`, when it is one of the library's own
 * classes; a subclass is the code's, named for itself */
const libraryName = (manager: Manager) =>
  KNOWN.find(({ cls }) => manager.constructor === cls)?.name;
export const sharesWithConsole = (manager: Manager) =>
  KNOWN.some(known => known.console && manager instanceof known.cls);

/** Whether a fetch it handles starts a request: a NetworkManager, the
 * library's or a subclass the code made of it */
export const startsRequests = (manager: Manager) =>
  manager instanceof NetworkManager;

/** A manager of a store's chain, as the Store inspector records it */
export interface ManagerStage {
  /** Its class's name */
  readonly className: string;
  /** Which of its class it is in the chain: 1 for the first, 2 for the next */
  readonly n: number;
  /** One of the library's own managers, which every store has unless the
   * code chooses otherwise (a subclass is the code's) */
  readonly library: boolean;
}

/** The stage before the chain: the app's own dispatches */
export const APP = 'the app';
/** A stage of the dispatch pipeline: the app, or a manager of the chain */
export type Stage = ManagerStage | typeof APP;

/** What the Store inspector calls `stage`: the app, or a manager's class,
 * with `#2` and on when a chain holds several of one class. Unique in its
 * chain */
export const stageName = (stage: Stage) =>
  stage === APP ? APP
  : stage.n > 1 ? `${stage.className} #${stage.n}`
  : stage.className;

interface StageCount {
  readonly stage: Stage;
  /** Actions it dispatched */
  sent: number;
  /** Actions it kept from the rest of the chain */
  handled: number;
}

/** Who sent an action and who kept it from the rest of the chain */
type Attributed = Pick<LogEntry, 'origin' | 'consumedBy'>;

/** Every stage a dispatch can start from, in order: the app, then the
 * chain */
export const stagesOf = (chain: readonly ManagerStage[]): Stage[] => [
  APP,
  ...chain,
];
/** The stage that sent `entry`: a manager, or the app */
export const originOf = (entry: Attributed): Stage => entry.origin ?? APP;

/** What the app and each manager of the chain, in order, did over
 * `entries` */
export function pipeline(
  chain: readonly ManagerStage[],
  entries: readonly Attributed[],
): readonly StageCount[] {
  const stages = new Map(
    stagesOf(chain).map(stage => [stage, { stage, sent: 0, handled: 0 }]),
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
    const { action, consumedBy, store } = entry;
    const key = JSON.stringify([
      action.type,
      stageName(originOf(entry)),
      consumedBy && stageName(consumedBy),
      !!store,
    ]);
    const route = seen.get(key);
    if (route) route.n++;
    else seen.set(key, { entry, n: 1 });
  }
  return [...seen.values()];
}

/** The chain to draw, once the store has managers */
export const shownChain = (managers: readonly ManagerStage[] | undefined) =>
  managers?.length ? managers : undefined;

/** Whether `entry` is one `stage` took part in: those it sent, and (a
 * manager) those it kept from the rest of the chain */
export function byStage(stage: Stage) {
  return (entry: Attributed) =>
    originOf(entry) === stage || entry.consumedBy === stage;
}

/** Each stage once: every store whose chain has the same class at the same
 * place among its class gets the same stage, so a history that spans
 * stores (one restored after an error, or remade when the code's managers
 * change) compares stages by identity, and a stage picked stays picked */
const STAGES = new Map<string, ManagerStage>();

/** Each manager of a chain as a stage: its class, and which of that class
 * it is */
export function managerStages(managers: readonly Manager[]): ManagerStage[] {
  const seen = new Map<string, number>();
  return managers.map(manager => {
    const library = !!libraryName(manager);
    const className =
      libraryName(manager) || manager.constructor?.name || 'Manager';
    const n = (seen.get(className) ?? 0) + 1;
    seen.set(className, n);
    const key = JSON.stringify([className, n, library]);
    let stage = STAGES.get(key);
    if (!stage) STAGES.set(key, (stage = { className, n, library }));
    return stage;
  });
}

export interface Attribution {
  /** Who is dispatching right now: the manager whose controller call is on
   * the stack. The log's head reads it as each action arrives, and clears
   * it, so what else that dispatch sets off isn't credited to it too */
  dispatching?: ManagerStage;
  /** The action each copy a middleware passed on was made from, so whoever
   * handles the copy is credited on the action the log recorded */
  readonly copies: WeakMap<ActionTypes, ActionTypes>;
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
export function copiedFrom(
  attribution: Attribution,
  action: ActionTypes,
  ancestor: ActionTypes,
): boolean {
  for (const a of lineage(attribution, action)) if (a === ancestor) return true;
  return false;
}

type AnyFn = (...args: any[]) => any;

/** `controller`, whose every call runs as `stage` dispatching */
export function asDispatcher(
  controller: Controller,
  stage: ManagerStage,
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
      const asStage = function (this: unknown, ...args: unknown[]) {
        const outer = attribution.dispatching;
        attribution.dispatching = stage;
        try {
          return value.apply(target, args);
        } finally {
          attribution.dispatching = outer;
        }
      };
      wrapped.set(value, asStage);
      return asStage;
    },
  });
}

/** Who sent `entries` (the first, which started them) and the first
 * manager to keep one from the rest of the chain, leaving out the library's
 * managers, whose work every playground has, so the code's own stand out.
 * An action's path still says all */
export function notableAttribution(entries: readonly Attributed[]): Attributed {
  const notable = (stage?: ManagerStage) =>
    stage && !stage.library ? stage : undefined;
  return {
    origin: notable(entries[0]?.origin),
    consumedBy: entries.find(e => notable(e.consumedBy))?.consumedBy,
  };
}
