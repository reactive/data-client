import { createContext, use } from 'react';

import {
  userEvent,
  type Caller,
  type CallerPage,
  type CallerSource,
} from './fetchCause';

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

/** The Controller method the preview's code is calling right now */
let method: string | undefined;

const named = new WeakMap<object, object>();

/** `controller`, its methods named while they run, so what they
 * dispatch is credited to them (a production build minifies their names).
 * The same object for the same controller, so it stays one dependency */
export function withMethodNames<C extends object>(controller: C): C {
  if (!controller || typeof controller !== 'object') return controller;
  let wrapped = named.get(controller);
  if (!wrapped) {
    const own: Record<string, unknown> = Object.create(controller);
    const proto = Object.getPrototypeOf(controller);
    // every method: one that doesn't dispatch is named for nothing
    const names = new Set([
      ...Object.keys(controller),
      ...Object.getOwnPropertyNames(proto),
    ]);
    names.delete('constructor');
    for (const name of names) {
      // a getter (`dispatch`) stays the controller's
      const fn =
        Object.getOwnPropertyDescriptor(controller, name)?.value ??
        Object.getOwnPropertyDescriptor(proto, name)?.value;
      if (typeof fn !== 'function') continue;
      // the original runs, so a method it calls (`fetchIfStale` calls
      // `fetch`) isn't named over it
      own[name] = (...args: unknown[]) => {
        const outer = method;
        method = name;
        try {
          return fn.apply(controller, args);
        } finally {
          method = outer;
        }
      };
    }
    named.set(controller, (wrapped = own));
  }
  return wrapped as C;
}

/** A stack frame of code the page evaluated, as the preview runs the
 * reader's code: V8's `at Name (eval at …, <anonymous>:line:col)`,
 * SpiderMonkey's `Name@… > Function:line:col`. Other engines (unchecked:
 * JavaScriptCore) may name only the hook */
const EVAL_FRAME =
  /^\s*at (?:async )?(?<v8>[\w$.]+) \(eval at .*?(?:<anonymous>:(?<v8Line>\d+):\d+\))?$|^(?<sm>[\w$.]*)@.*> (?:Function|eval):(?<smLine>\d+):\d+/;

/** `text`'s function name (empty when anonymous) and line, if it is a frame
 * of evaluated code */
function evalFrame(text: string) {
  const groups = EVAL_FRAME.exec(text)?.groups;
  return (
    groups && {
      name: groups.v8 ?? groups.sm,
      at: groups.v8Line ?? groups.smLine,
    }
  );
}

/** A function of the reader's on the stack, and the line it was on in the
 * program the preview evaluated (counted from the program's first line) */
export interface EvaluatedFrame {
  readonly name: string;
  readonly line?: number;
}

/** The reader's frames on `stack`, innermost first */
export function evaluatedFrames(stack: string | undefined): EvaluatedFrame[] {
  if (!stack) return [];
  const frames: EvaluatedFrame[] = [];
  for (const text of stack.split('\n')) {
    const frame = evalFrame(text);
    if (!frame) continue;
    const { name, at } = frame;
    frames.push({
      name: name.slice(name.lastIndexOf('.') + 1),
      ...(at && { line: Number(at) - programStart() + 1 }),
    });
  }
  return frames;
}

let bodyLine: number | undefined;
/** The line a `new Function` body starts on in its frames: the engine puts
 * the `function anonymous(…) {` header it builds before it (react-live
 * evaluates the program so) */
function programStart() {
  if (bodyLine === undefined) {
    const stack: string = new Function('a', 'b', 'return new Error().stack')();
    const at = stack.split('\n').map(evalFrame).find(Boolean)?.at;
    bodyLine = Number(at ?? 1);
  }
  return bodyLine;
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

/** Where line `line` of the evaluated program is in the playground's files */
type LocateLine = (line: number) => CallerSource | undefined;

/** Who is dispatching right now: while a hook renders, it and its
 * component (the event a render runs within is the action's that caused
 * it, not this one's); otherwise the user event being handled. With
 * `locate`, also the line of the reader's code that dispatched it */
export function callerNow(locate?: LocateLine): Caller | undefined {
  const frames = calling || locate ? evaluatedFrames(deepStack()) : [];
  const source = locate && sourceOf(frames, locate);
  const component =
    calling && frames.find(frame => isComponentName(frame.name))?.name;
  const event =
    !calling &&
    userEvent(typeof window === 'undefined' ? undefined : window.event);
  const caller: Caller = {
    ...(calling && { hook: calling.hook }),
    ...(method && { method }),
    ...(component && { component }),
    // the app's own first render (visit 0) is no navigation
    ...(calling?.page?.visit && { page: calling.page }),
    ...(event && { event }),
    ...(source && { source }),
  };
  return Object.keys(caller).length ? caller : undefined;
}

/** The innermost line of the reader's files on the stack: the call into the
 * library that dispatched */
function sourceOf(frames: readonly EvaluatedFrame[], locate: LocateLine) {
  for (const { line } of frames) {
    const source = line && locate(line);
    if (source) return source;
  }
}
