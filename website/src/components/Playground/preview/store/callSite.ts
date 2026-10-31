import { createContext, use } from 'react';

import { userEvent, type Caller, type CallerPage } from './fetchCause';

/** The page of the preview's router (./router.tsx) a component renders in.
 * Its first page (visit 0) is the app's own first render, not a navigation */
export const PageContext = createContext<CallerPage | undefined>(undefined);

/** The library hook the preview's code is calling right now (see
 * `asHook`), with the page its component renders in: an action dispatched
 * meanwhile is that hook's, from the component rendering */
let calling: { hook: string; page?: CallerPage } | undefined;

/** `hook`, named `name` while it runs, so what it dispatches is credited
 * to it (a production build minifies the library's own names) */
export function asHook<F extends (...args: any[]) => any>(
  name: string,
  hook: F,
): F {
  return function (this: unknown, ...args: unknown[]) {
    const outer = calling;
    // a hook within a hook renders in the same page
    calling = { hook: name, page: outer ? outer.page : use(PageContext) };
    try {
      return hook.apply(this, args);
    } finally {
      calling = outer;
    }
  } as F;
}

/** `scope` with its hooks wrapped by `asHook`: those that dispatch while a
 * component renders (a fetch, a subscribe) are credited */
export function withHookNames<S extends Record<string, unknown>>(scope: S): S {
  const named: Record<string, unknown> = { ...scope };
  for (const [name, hook] of Object.entries(scope)) {
    if (/^use[A-Z]/.test(name) && typeof hook === 'function')
      named[name] = asHook(name, hook as any);
  }
  return named as S;
}

/** A stack frame of code the page evaluated, as the preview runs the
 * reader's code: V8's `at Name (eval at …)`, SpiderMonkey's
 * `Name@… > Function:…`. Other engines (unchecked: JavaScriptCore) may name
 * only the hook */
const EVAL_FRAME =
  /^\s*at (?:async )?([\w$.]+) \(eval at |^([\w$.]+)@.*> (?:Function|eval):\d/;

/** Names of the reader's functions on `stack`, innermost first */
export function evaluatedFrames(stack: string | undefined): string[] {
  if (!stack) return [];
  const names: string[] = [];
  for (const line of stack.split('\n')) {
    const match = EVAL_FRAME.exec(line);
    const name = match?.[1] ?? match?.[2];
    if (name) names.push(name.slice(name.lastIndexOf('.') + 1));
  }
  return names;
}

/** Frames from the library's dispatch down to the component */
const STACK_DEPTH = 40;

/** The stack here, deep enough to reach the component rendering (V8 keeps
 * 10 frames unless told otherwise) */
function deepStack(): string | undefined {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = STACK_DEPTH;
  try {
    return new Error().stack;
  } finally {
    Error.stackTraceLimit = limit;
  }
}

/** Components are capitalized; a custom hook the reader wrote between it
 * and the library's isn't */
const isComponentName = (name: string) => /^[A-Z]/.test(name);

/** Who is dispatching right now: while a hook renders, it and its
 * component (the event a render runs within is the action's that caused
 * it, not this one's); otherwise the user event being handled */
export function callerNow(): Caller | undefined {
  if (calling) {
    const component = evaluatedFrames(deepStack()).find(isComponentName);
    const { hook, page } = calling;
    return {
      hook,
      ...(component && { component }),
      // the app's own first render (visit 0) is no navigation
      ...(page?.visit && { page }),
    };
  }
  const event = userEvent(
    typeof window === 'undefined' ? undefined : window.event,
  );
  return event && { event };
}
