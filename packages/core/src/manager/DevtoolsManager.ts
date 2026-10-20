import { FETCH, SUBSCRIBE, UNSUBSCRIBE } from '../actionTypes.js';
import type { DevToolsConfig } from './devtoolsTypes.js';
import type { Controller, EndpointInterface } from '../index.js';
import type { Middleware } from '../middlewareTypes.js';
import createReducer from '../state/reducer/createReducer.js';
import type { Manager, State, ActionTypes } from '../types.js';

export type { DevToolsConfig };

let DEFAULT_CONFIG = {};

if (process.env.NODE_ENV !== 'production') {
  const extraEndpointKeys = [
    'dataExpiryLength',
    'errorExpiryLength',
    'errorPolicy',
    'invalidIfStale',
    'pollFrequency',
    'getOptimisticResponse',
    'update',
  ];

  function serializeEndpoint(endpoint: EndpointInterface) {
    const serial: any = {
      name: endpoint.name,
      schema: (endpoint.schema as any)?.toJSON?.() ?? endpoint.schema,
      sideEffect: endpoint.sideEffect,
    };
    extraEndpointKeys.forEach(key => {
      if (key in endpoint)
        serial[key] = endpoint[key as keyof EndpointInterface];
    });
    return serial;
  }

  const dateFormat =
    typeof Intl !== 'undefined' ?
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
      })
    : undefined;
  DEFAULT_CONFIG = {
    name: `Data Client: ${globalThis.document?.title}`,
    autoPause: true,
    features: {
      pause: true, // start/pause recording of dispatched actions
      lock: true, // lock/unlock dispatching actions and side effects
      persist: false, // persist states on page reloading
      export: true, // export history of actions in a file
      import: 'custom', // import history of actions from a file
      jump: true, // jump back and forth (time travelling)
      skip: true, // skip (cancel) actions
      reorder: true, // drag and drop actions in the history list
      dispatch: false, // dispatch custom actions or action creators
      test: false, // generate tests for the selected actions
    },
    actionSanitizer: (action: ActionTypes) => {
      if (!('endpoint' in action)) return action;
      return {
        ...action,
        endpoint: serializeEndpoint(action.endpoint),
      };
    },
    serialize: {
      options: undefined,
      /* istanbul ignore next */
      replacer:
        dateFormat ?
          (key: string | number | symbol, value: unknown) => {
            if (
              typeof value === 'number' &&
              typeof key === 'string' &&
              isFinite(value) &&
              (key === 'date' || key.endsWith('At'))
            ) {
              return dateFormat.format(value);
            }
            return value;
          }
        : undefined,
    },
  };
}

/** Appends, dropping the oldest half once over `max`.
 *
 * Halving means we aren't reallocating on every push; trimming in place keeps
 * arrays shared on globals (like `__DC_ACTIONS__`) current.
 */
function pushCapped<T>(buffer: T[], item: T, max: number) {
  buffer.push(item);
  if (buffer.length > max) buffer.splice(0, max / 2);
}

/** Newest actions kept whole in the action log; older ones are summarized.
 *
 * Matches the 20 the debugging skill reads.
 */
const FULL_ACTIONS = 20;

/** Keeps what shows what happened and when, dropping what retains memory
 * (response bodies, set values, fetch promises).
 *
 * Keeps `endpoint` and `args`, so `controller.getResponse(a.endpoint, ...a.args, state)`
 * works for any logged key.
 *
 * Builds the object explicitly: a rest spread here was 4x slower.
 */
function summarize(action: any) {
  const summary: any = {
    type: action.type,
    key: action.key,
    endpoint: action.endpoint,
    args: action.args,
    meta:
      action.type === FETCH ?
        { fetchedAt: action.meta.fetchedAt }
      : action.meta,
  };
  if (action.error) {
    summary.error = true;
    summary.response = action.response;
  }
  return summary;
}

/** `globalThis.__DC__`: one store's Controller and action log, for console and agent debugging.
 *
 * Reads the registries on every access, so it follows a remounted provider.
 * Getters live on the prototype, so serializing `__DC__` yields only `store`.
 */
class DebugStore {
  /** Registry key to read; may be left unset when the page has one store */
  declare store?: string;

  get controller(): Controller {
    return (globalThis as any).__DC_CONTROLLERS__.get(this.resolveKey());
  }

  get actions(): ActionTypes[] {
    return (globalThis as any).__DC_ACTIONS__.get(this.resolveKey());
  }

  protected resolveKey(): string {
    const controllers: Map<string, Controller> =
      (globalThis as any).__DC_CONTROLLERS__ ?? new Map();
    const key =
      this.store ??
      (controllers.size === 1 ? controllers.keys().next().value : undefined);
    if (key !== undefined && controllers.has(key)) return key;
    throw new Error(
      controllers.size ?
        `Set __DC__.store to one of: ${[...controllers.keys()].map(k => JSON.stringify(k)).join(', ')}`
      : 'No Data Client store is mounted',
    );
  }
}

/** Integrates with https://github.com/reduxjs/redux-devtools
 *
 * Options: https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md
 *
 * @see https://dataclient.io/docs/api/DevToolsManager
 */
export default class DevToolsManager implements Manager {
  declare middleware: Middleware;
  declare protected devTools: undefined | any;
  protected started = false;
  protected actions: [ActionTypes, State<unknown>][] = [];
  /** Recent actions, kept in development whether or not the extension is connected */
  declare protected actionLog: ActionTypes[];
  /** Key this controller is registered under in `__DC_CONTROLLERS__` and `__DC_ACTIONS__` */
  declare protected registryKey?: string;
  /** Subscriber count for each key that is polling; a key is removed when its count reaches 0 */
  declare protected pollingSubscribers: Map<string, number>;
  /** Actions kept in the log for each key while it polls (development only) */
  declare maxPollingActions: number;
  declare protected controller: Controller;
  declare skipLogging?: (action: ActionTypes) => boolean;
  declare devtoolsName: string;
  maxBufferLength = 100;

  constructor(
    config?: DevToolsConfig,
    skipLogging?: (action: ActionTypes) => boolean,
  ) {
    /* istanbul ignore next */
    const options = { ...DEFAULT_CONFIG, ...config };
    this.devtoolsName =
      options.name ?? `Data Client: ${globalThis.document?.title}`;
    this.devTools =
      typeof window !== 'undefined' &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__ &&
      (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect(options);
    // we cut it in half so we should double so we don't lose
    if (config?.maxAge) this.maxBufferLength = config.maxAge * 2;
    if (skipLogging) this.skipLogging = skipLogging;
    if (process.env.NODE_ENV !== 'production') {
      this.actionLog = [];
      this.pollingSubscribers = new Map();
      this.maxPollingActions = config?.maxPollingActions || 4;
    }
  }

  static {
    /* istanbul ignore if */
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production') {
      this.prototype.middleware = function (controller) {
        // a reused manager starts a fresh log for a new store
        if (controller !== this.controller) this.actionLog = [];
        this.controller = controller;
        const reducer = this.devTools && createReducer(controller as any);
        let state = controller.getState();
        /** Counts polling subscribers per key, even for actions skipLogging hides */
        const trackPolling = (action: ActionTypes) => {
          if (
            (action.type === SUBSCRIBE || action.type === UNSUBSCRIBE) &&
            action.endpoint.pollFrequency !== undefined
          ) {
            const count =
              (this.pollingSubscribers.get(action.key) ?? 0) +
              (action.type === SUBSCRIBE ? 1 : -1);
            if (count > 0) this.pollingSubscribers.set(action.key, count);
            else this.pollingSubscribers.delete(action.key);
          }
        };
        /** Keeps `__DC_ACTIONS__` small: polling keys keep only their latest actions,
         * and all but the newest actions drop their payloads.
         */
        const logAction = (action: ActionTypes) => {
          const log = this.actionLog;
          const key = (action as { key?: string }).key;
          if (key !== undefined && this.pollingSubscribers.has(key)) {
            // drop all but the newest maxPollingActions - 1, making room for this one
            for (let i = log.length - 1, seen = 0; i >= 0; i--) {
              if (
                (log[i] as { key?: string }).key === key &&
                ++seen >= this.maxPollingActions
              )
                log.splice(i, 1);
            }
          }
          pushCapped(log, action, this.maxBufferLength);
          const old = log.length - 1 - FULL_ACTIONS;
          if (old >= 0) log[old] = summarize(log[old]);
        };
        return next => action => {
          const shouldSkip = this.skipLogging?.(action);
          trackPolling(action);
          if (!shouldSkip) logAction(action);
          const ret = next(action);
          if (!reducer) return ret;
          if (this.started) {
            // we track state changes here since getState() will only update after a batch commit
            state = reducer(state, action);
          } else {
            state = controller.getState();
          }
          ret.then(() => {
            if (shouldSkip) return;
            this.handleAction(action, state.optimistic.reduce(reducer, state));
          });
          return ret;
        };
      };
    } else {
      this.prototype.middleware = () => next => action => next(action);
    }
  }

  handleAction(action: any, state: any) {
    if (this.started) {
      this.devTools.send(action, state);
    } else {
      // queue actions
      pushCapped(this.actions, [action, state], this.maxBufferLength);
    }
  }

  /** Called when initial state is ready */
  init(state: State<any>) {
    if (process.env.NODE_ENV !== 'production') {
      const controllers: Map<string, Controller> = ((
        globalThis as any
      ).__DC_CONTROLLERS__ ??= new Map());
      // keep the key this controller already holds (init can run again without cleanup)
      let key =
        (
          this.registryKey !== undefined &&
          controllers.get(this.registryKey) === this.controller
        ) ?
          this.registryKey
        : this.devtoolsName;
      // another provider has the name: register under 'name (2)', 'name (3)', ...
      // Without a window (server rendering), stores are made per request and never cleaned up,
      // so replace the old one instead of keeping every request's store alive.
      // Checks window, not document: React Native has a window but no document.
      if (typeof window !== 'undefined')
        for (
          let i = 2;
          controllers.has(key) && controllers.get(key) !== this.controller;
          i++
        )
          key = `${this.devtoolsName} (${i})`;
      this.registryKey = key;
      controllers.set(key, this.controller);
      ((globalThis as any).__DC_ACTIONS__ ??= new Map()).set(
        key,
        this.actionLog,
      );
      (globalThis as any).__DC__ ??= new DebugStore();
    }
    if (process.env.NODE_ENV !== 'production' && this.devTools) {
      this.devTools.init(state);
      this.devTools.subscribe((msg: any) => {
        switch (msg.type) {
          case 'START':
            this.started = true;

            if (this.actions.length) {
              this.actions.forEach(([action, state]) => {
                this.handleAction(action, state);
              });
              this.actions = [];
            }
            break;
          case 'STOP':
            this.started = false;
            break;
          case 'DISPATCH':
            if (msg.payload.type === 'RESET') {
              this.controller.resetEntireStore();
            }
            break;
        }
      });
    }
  }

  /** Ensures all subscriptions are cleaned up. */
  cleanup() {
    if (process.env.NODE_ENV !== 'production') {
      // SubscriptionManager.cleanup() stops polling without dispatching unsubscribes
      this.pollingSubscribers.clear();
      const key = this.registryKey;
      const map: Map<string, Controller> | undefined = (globalThis as any)
        .__DC_CONTROLLERS__;
      if (key !== undefined && map?.get(key) === this.controller) {
        map.delete(key);
        (globalThis as any).__DC_ACTIONS__?.delete(key);
      }
    }
  }
}
