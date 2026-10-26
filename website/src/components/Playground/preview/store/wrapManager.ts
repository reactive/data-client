import type { ActionTypes, Manager, State } from '@data-client/react';

import {
  asDispatcher,
  copiedFrom,
  sharesWithConsole,
  type Attribution,
} from './attribution';

export interface Wrap {
  /** The manager's name (unique in its chain), credited with what it sends */
  readonly name: string;
  readonly attribution: Attribution;
  /** Told of each action its middleware returned without passing on (when
   * its promise settles, for async middleware), or with no one when it
   * passes one on later */
  readonly consumed: (action: ActionTypes, by?: string) => void;
  /** Guards the manager (the code's own): a call that throws, or a promise
   * of its middleware that rejects, is reported here and its step skipped
   * (actions go on to the next middleware), so it can't take the preview
   * down */
  readonly report?: (error: unknown) => void;
}

/** `manager`, wrapped once for the Store inspector and, with `report`, the
 * guard. It runs as `name` while it calls its controller (what it
 * dispatches through `set`, `fetch`, `dispatch` …). Passing on a copy
 * (`next({ ...action })`) counts while the middleware runs. The prototype
 * stays the manager, so `instanceof` checks still see its class */
export function wrapManager(
  manager: Manager,
  { name, attribution, consumed, report }: Wrap,
): Manager {
  /** `fn`, or `fallback` once `fn` throws (or its promise rejects, as
   * `async action => …` middleware does) when guarded */
  const attempt = <A extends unknown[], R>(
    fn: (...args: A) => R,
    fallback: (...args: A) => R,
  ): ((...args: A) => R) =>
    report ?
      (...args) => {
        const fail = (error: unknown) => {
          report(error);
          return fallback(...args);
        };
        let result;
        try {
          result = fn(...args);
        } catch (error) {
          return fail(error);
        }
        if (result instanceof Promise) return result.catch(fail) as R;
        return result;
      }
    : fn;
  const skip = () => {};
  /** `fn`, what the manager's middleware returned at one of its levels, or
   * an error when it is no function: untyped playground code can forget to
   * return one */
  const expectFunction = <F>(fn: F, shape: string): F => {
    if (typeof fn !== 'function')
      throw new Error(
        `${manager.constructor.name}'s middleware returned no function where it must return ${shape}.`,
      );
    return fn;
  };
  const wrapped: Manager = Object.create(manager);
  // with `this` the manager, as DataProvider would call them
  if (manager.init)
    wrapped.init = attempt(
      (state: State<unknown>) => manager.init!(state),
      skip,
    );
  wrapped.cleanup = attempt(() => manager.cleanup(), skip);
  const sends = !sharesWithConsole(manager);
  wrapped.middleware = controller => {
    const own =
      sends ? asDispatcher(controller, name, attribution) : controller;
    const withController = attempt(
      () => {
        const { middleware } = manager;
        // untyped playground code can leave out the required middleware
        if (!middleware)
          throw new Error(
            `${manager.constructor.name} has no middleware. Managers must define middleware.`,
          );
        // may be a prototype method that reads `this`
        return expectFunction(
          middleware.call(manager, own),
          'next => action => …',
        );
      },
      () => undefined,
    )();
    return next => {
      const passed = new WeakSet<object>();
      const reported = new WeakSet<object>();
      /** The actions this middleware is running for, innermost last */
      const running: ActionTypes[] = [];
      const passOn = (action: ActionTypes) => {
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
      };
      // a middleware that failed to build (already reported) has no step
      const step =
        withController &&
        attempt(
          () => expectFunction(withController(passOn), 'action => …'),
          () => undefined,
        )();
      // a step that failed to build passes every action on, unguarded, so
      // what fails after it isn't reported as its error
      const dispatch =
        step ?
          // a step that throws after passing the action on must not pass it
          // twice
          attempt(step, (action: ActionTypes) =>
            passed.has(action) ? Promise.resolve() : passOn(action),
          )
        : passOn;
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
  return wrapped;
}
