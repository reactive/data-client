import {
  ExpiryStatus,
  type Controller,
  type FetchAction,
  type State,
} from '@data-client/react';

/** Why a fetch went out, read from the store as it stood when it was
 * dispatched (before the fetch itself). Plain data, so a history keeps it
 * through a copy (`structuredClone`, or a message to devtools). Nothing
 * here knows the playground: a devtools extension reads the same store */
export type FetchReason =
  /** Nothing stored for its key: its first load, or new args */
  | 'missing'
  /** Its data was invalidated (the endpoint, or an entity it holds), so
   * components can't show it until the fetch resolves */
  | 'invalid'
  /** Its data was past its expiry: components show it while it refetches */
  | 'stale'
  /** Its last fetch failed (any data from before it stays) */
  | 'error'
  /** Its data was fresh: something asked for it anyway (a refresh button,
   * a manager, a poll) */
  | 'fresh'
  /** A side effect (a mutation): it fetches whenever it is called */
  | 'mutation';

/** Why `action` fetched, given the store `state` right before it. `reader`
 * is any Controller: it only reads `state` */
export function fetchReason(
  reader: Controller,
  state: State<unknown>,
  { endpoint, args, key }: FetchAction,
  now = Date.now(),
): FetchReason {
  if (endpoint?.sideEffect) return 'mutation';
  const meta = state.meta[key];
  if (meta?.invalidated) return 'invalid';
  // its last fetch failed, whether or not earlier data stayed
  if (meta?.error) return 'error';
  // an endpoint that crossed a copy (a message to devtools) has no
  // methods: read its row alone, without the entities it holds
  if (typeof endpoint?.key !== 'function' || !Array.isArray(args)) {
    if (!(key in state.endpoints)) return 'missing';
    return now > (meta?.expiresAt ?? 0) ? 'stale' : 'fresh';
  }
  const { data, expiryStatus, expiresAt } = reader.getResponseMeta(
    endpoint,
    ...args,
    state,
  );
  if (data === undefined)
    // stored, but an entity it holds was invalidated
    return key in state.endpoints && expiryStatus === ExpiryStatus.Invalid ?
        'invalid'
      : 'missing';
  if (expiryStatus === ExpiryStatus.Invalid) return 'invalid';
  return now > expiresAt ? 'stale' : 'fresh';
}

/** Who asked for a fetch (or sent any action), as far as the page can
 * tell. Every part is optional: a production build, or a call from outside
 * a component, knows less */
export interface Caller {
  /** The component rendering when it was dispatched */
  readonly component?: string;
  /** The hook that dispatched it (`useSuspense`, `useFetch` …) */
  readonly hook?: string;
  /** The user event being handled when it was dispatched */
  readonly event?: CallerEvent;
}

export interface CallerEvent {
  /** The DOM event's type: `click`, `submit` … */
  readonly type: string;
  /** What it happened to, as a person would name it: a button's text, a
   * field's label */
  readonly target?: string;
}

/** Events a person makes: an action dispatched while one is handled is
 * that person's doing */
const USER_EVENTS = new Set([
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
  'pointerdown',
  'pointerup',
  'mousedown',
  'mouseup',
  'touchstart',
  'touchend',
  'keydown',
  'keyup',
  'input',
  'change',
  'submit',
  'reset',
  'focus',
  'blur',
  'drop',
]);

/** The longest a target's name runs */
const TARGET_MAX = 40;

/** The user event `event` (the browser's current `window.event`), when it
 * is one a person made */
export function userEvent(event: Event | undefined): CallerEvent | undefined {
  if (!event || !USER_EVENTS.has(event.type)) return;
  const target = targetName(event.target);
  return target ? { type: event.type, target } : { type: event.type };
}

/** What a person can press or fill in */
const CONTROLS =
  'button, a, label, input, select, textarea, [role=button], [role=link], [role=tab], [role=menuitem], [role=option], [role=checkbox], [role=radio], [role=switch]';
/** Inputs whose value is their label, not what a person typed */
const BUTTON_INPUTS = new Set(['button', 'submit', 'reset']);

/** What a person would call `target`: its label, else a control's text,
 * else its name, else its tag. Never what a person typed into a field */
function targetName(target: EventTarget | null): string | undefined {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return;
  const control = target.closest(CONTROLS);
  const el = control ?? target;
  const name =
    el.getAttribute('aria-label') ||
    (el instanceof HTMLInputElement ?
      BUTTON_INPUTS.has(el.type) ?
        el.value
      : el.labels?.[0]?.textContent
    : el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement ?
      el.labels?.[0]?.textContent
    : control?.textContent) ||
    el.getAttribute('name') ||
    el.tagName.toLowerCase();
  const text = name.replace(/\s+/g, ' ').trim();
  return text.length > TARGET_MAX ? `${text.slice(0, TARGET_MAX - 1)}…` : text;
}
