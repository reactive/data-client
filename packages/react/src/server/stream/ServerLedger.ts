import { actionTypes, initialState } from '@data-client/core';
import type { Manager, Middleware, State } from '@data-client/core';

import { diffState } from './diffState.js';
import { WIRE_VERSION } from './wire.js';
import type { PieceMessage, StreamMessage } from './wire.js';
import type { Store } from '../../context.js';

export interface ServerLedger {
  /** Records the key of each FETCH as an announcement. First in the server store's managers. */
  readonly manager: Manager;
  /** Sets the request's root store and starts recording one piece for each committed change */
  attach(store: Store<State<unknown>>): void;
  /**
   * A view of the root store whose `getState` sets the pin of boundary `id`,
   * and of no other boundary, to the current revision. The same view per id.
   */
  scope(id: string): Store<State<unknown>>;
  /**
   * Messages not sent yet, in order: `open` on the first call, then pieces,
   * then each pin that is new or moved, then announcements.
   */
  take(): StreamMessage[];
  /** `take()` followed by `end`. Call once, after the last flush. */
  end(): StreamMessage[];
}

export function createServerLedger(now: () => number = Date.now): ServerLedger {
  let root: Store<State<unknown>> | undefined;
  let prevState: State<unknown> = initialState;
  let rev = 0;
  let opened = false;
  let ended = false;
  let pieces: PieceMessage[] = [];
  const pins = new Map<string, number>();
  const sentPins = new Map<string, number>();
  const announced = new Set<string>();
  let announce: string[] = [];
  const scopes = new Map<string, Store<State<unknown>>>();

  const record = () => {
    const next = root!.getState();
    if (next === prevState) return;
    const slots = diffState(prevState, next);
    prevState = next;
    if (slots) pieces.push({ t: 'piece', rev: ++rev, ...slots });
  };

  const middleware: Middleware = () => next => action => {
    if (action.type === actionTypes.FETCH && !announced.has(action.key)) {
      announced.add(action.key);
      announce.push(action.key);
    }
    return next(action);
  };

  const take = (): StreamMessage[] => {
    if (ended) return [];
    const out: StreamMessage[] = [];
    if (!opened) {
      opened = true;
      out.push({ t: 'open', v: WIRE_VERSION, rev, at: now() });
    }
    out.push(...pieces);
    pieces = [];
    for (const [id, pinRev] of pins) {
      if (sentPins.get(id) === pinRev) continue;
      sentPins.set(id, pinRev);
      out.push({ t: 'pin', id, rev: pinRev });
    }
    if (announce.length) {
      out.push({ t: 'ann', keys: announce });
      announce = [];
    }
    return out;
  };

  return {
    manager: { middleware, cleanup() {} },
    attach(store) {
      root = store;
      record();
      store.subscribe(record);
    },
    scope(id) {
      let view = scopes.get(id);
      if (!view) {
        view = {
          subscribe: listener => root!.subscribe(listener),
          getState() {
            pins.set(id, rev);
            return root!.getState();
          },
        };
        scopes.set(id, view);
      }
      return view;
    },
    take,
    end() {
      const out = take();
      if (!ended) {
        ended = true;
        out.push({ t: 'end' });
      }
      return out;
    },
  };
}
