import { actionTypes } from '@data-client/core';

import { SSR } from '../components/LegacyReact.js';
import type {
  Controller,
  Manager,
  Middleware,
  SetResponseAction,
} from '@data-client/core';

/** Holds fetch results until DataProvider mounts
 *
 * A fetch can settle before its DataProvider commits, when something outside it
 * suspends or when the provider sits in a lazy layout (as with Expo Router on web). React
 * discards that render's store, so the result would land nowhere. This holds
 * results until init() and replays them into the store that mounted.
 *
 * Place it first in the managers it protects, with one gate per DataProvider.
 * @see https://dataclient.io/docs/api/CommitGateManager
 */
export default class CommitGateManager implements Manager {
  protected held: [
    action: SetResponseAction,
    settle: (result?: Promise<void>) => void,
  ][] = [];
  protected controller?: Controller;
  protected mounted?: Controller;
  // NetworkManager reads lastReset from a store that hasn't committed, which a reset never reached
  protected resetAt = 0;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => action => {
      // a server render never commits, so holding would only leak
      if (SSR) return next(action);
      // held results predate any reset, whichever store it reaches
      if (action.type === actionTypes.RESET) {
        this.resetAt = action.date;
        this.drop();
      }
      if (
        controller === this.mounted ||
        action.type !== actionTypes.SET_RESPONSE
      )
        return next(action);
      // fetched before that reset, as NetworkManager would drop it once mounted
      if (action.meta.fetchedAt < this.resetAt) return Promise.resolve();
      return new Promise<void>(settle => this.held.push([action, settle]));
    };
  };

  init() {
    this.mounted = this.controller;
    // init() runs in the host's commit, where dispatch overrides such as act() throw
    if (this.held.length) Promise.resolve().then(() => this.replay());
  }

  cleanup() {
    this.mounted = undefined;
  }

  protected replay() {
    const mounted = this.mounted;
    // unmounted again before this job; keep holding for the next init()
    if (!mounted) return;
    const held = this.held;
    this.held = [];
    for (const [action, settle] of held) {
      try {
        settle(mounted.dispatch(action));
      } catch (error) {
        // like NetworkManager once mounted: a throw becomes that fetch's error, and a
        // throw while publishing an error is swallowed; the rest still replay
        settle(
          action.error ? undefined : (
            new Promise<void>(resolve =>
              resolve(
                mounted.resolve(action.endpoint, {
                  args: action.args,
                  response: error as Error,
                  fetchedAt: action.meta.fetchedAt,
                  error: true,
                }),
              ),
            ).catch(() => {})
          ),
        );
      }
    }
  }

  protected drop() {
    for (const [, settle] of this.held) settle();
    this.held = [];
  }
}
