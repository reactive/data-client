import {
  getDefaultManagers,
  NetworkManager,
  type Controller,
  type Manager,
  type State,
} from '@data-client/react';

import { takeSnapshot, type PreviewSnapshot } from './usePreviewReset';
import type { CodeDocument } from '../editor/codeModel';

/** Identifies the documents `getManagers()` depends on: the one defining it,
 * and those declaring a name it (or another of them) uses, such as a Manager
 * class in its own file. Editing them gives the store new managers; other
 * edits keep them. */
export function managersVersion(documents: readonly CodeDocument[]): string {
  const sources = documents.map(({ value }) => value);
  const used = sources.filter(value => DEFINES_GET_MANAGERS.test(value));
  for (let i = 0; i < used.length; i++) {
    for (const value of sources) {
      if (used.includes(value)) continue;
      for (const [, name] of value.matchAll(DECLARATION)) {
        if (
          new RegExp(`(?<![\\w$])${name.replace(/\$/g, '\\$')}(?![\\w$])`).test(
            used[i],
          )
        ) {
          used.push(value);
          break;
        }
      }
    }
  }
  let hash = 0;
  for (const value of sources) {
    if (!used.includes(value)) continue;
    for (let i = 0; i < value.length; i++)
      hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}
const DEFINES_GET_MANAGERS = /\bfunction\s+getManagers\b|\bgetManagers\s*[:=]/;
const DECLARATION =
  /\b(?:class|function|const|let|var|enum)\s+([A-Za-z_$][\w$]*)/g;

/** Managers a playground's code declares with `getManagers()`, the same
 * function a real app passes to `<DataProvider managers>`.
 *
 * DataProvider reads its managers once, so registering a new version calls
 * `onChange` with the store's data, to remount it. react-live renders the new
 * code's element in the same batch, so it never runs against the old store.
 * Edits elsewhere only swap in the newest function for the next store, so open
 * sockets stay open while typing in other files.
 */
export default class ManagerHost {
  /** Latest `getManagers` the code registered */
  protected getManagers?: () => Manager[];
  /** `managersVersion()` of the code that last registered */
  protected version = managersVersion([]);
  /** The current store's (MockResolver's) controller; set by ManagersSync */
  controller?: Controller;
  /** A user manager threw; shown until the next store */
  error?: unknown;
  protected listeners = new Set<() => void>();

  constructor(protected onChange: (snapshot: PreviewSnapshot) => void) {}

  register = (getManagers: (() => Manager[]) | undefined, version: string) => {
    this.getManagers = getManagers;
    if (version === this.version) return;
    this.version = version;
    if (this.controller) this.onChange(takeSnapshot(this.controller));
  };

  /** Managers for a new store: the code's, or the defaults. `network` is
   * among them (the code's own, or one added for it) */
  create(): { managers: Manager[]; network: NetworkManager } {
    this.error = undefined;
    let managers =
      this.declared()?.map(this.guard) ??
      getDefaultManagers({ devToolsManager: null });
    let network = managers.find(
      (manager): manager is NetworkManager => manager instanceof NetworkManager,
    );
    // DataProvider warns about this; keep the preview working meanwhile
    if (!network) managers = [...managers, (network = new NetworkManager())];
    return { managers, network };
  }

  /** What the code's `getManagers()` returns, if it returns managers */
  protected declared(): Manager[] | undefined {
    try {
      const managers = this.getManagers?.();
      if (Array.isArray(managers)) return managers;
    } catch (error) {
      // called while rendering the new store: no one to notify yet
      console.error(error);
      this.error = error;
    }
  }

  /** For `useSyncExternalStore` of `error` */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  protected report = (error: unknown) => {
    console.error(error);
    this.error = error;
    // middleware may run while the store renders
    queueMicrotask(() => this.listeners.forEach(listener => listener()));
  };

  /** Keeps a throwing manager from taking the preview down: its failed
   * step is skipped (actions go on to the next middleware). The prototype
   * stays the manager, so `instanceof` checks still see its class. */
  protected guard = (manager: Manager): Manager => {
    /** `fn`, or `fallback` once `fn` throws (or its promise rejects, as
     * `async action => …` middleware does) */
    const attempt =
      <A extends unknown[], R>(
        fn: (...args: A) => R,
        fallback: (...args: A) => R,
      ) =>
      (...args: A): R => {
        const fail = (error: unknown) => {
          this.report(error);
          return fallback(...args);
        };
        try {
          const result = fn(...args);
          return result instanceof Promise ? (result.catch(fail) as R) : result;
        } catch (error) {
          return fail(error);
        }
      };
    const skip = () => {};
    const guarded: Manager = Object.create(manager);
    guarded.init = attempt(
      (state: State<unknown>) => manager.init?.(state),
      skip,
    );
    guarded.cleanup = attempt(() => manager.cleanup(), skip);
    guarded.middleware = attempt(
      controller => {
        // optional in the Manager type, but applyManager() calls it
        const middleware = manager.middleware ?? manager.getMiddleware?.();
        if (!middleware) return next => next;
        // may be a prototype method that reads `this`
        const withController = middleware.call(manager, controller);
        return attempt(
          next => {
            // a step that throws after passing the action on must not pass it twice
            const passed = new WeakSet<object>();
            const dispatch = withController(action => {
              passed.add(action);
              return next(action);
            });
            return attempt(dispatch, action =>
              passed.has(action) ? Promise.resolve() : next(action),
            );
          },
          next => next,
        );
      },
      () => next => next,
    );
    return guarded;
  };
}
