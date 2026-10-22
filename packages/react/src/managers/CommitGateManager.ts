import { actionTypes } from '@data-client/core';
import type {
  ActionTypes,
  Controller,
  Manager,
  Middleware,
} from '@data-client/core';

/** Holds fetch results until DataProvider mounts
 *
 * A fetch can settle before its DataProvider commits, when something outside it
 * suspends or when the provider sits in a lazy layout (as with Expo Router). React
 * discards that render's store, so the result would land nowhere. This holds
 * results until init() and replays them into the store that mounted.
 *
 * Place it first in the managers it protects, with one gate per DataProvider.
 * @see https://dataclient.io/docs/api/CommitGateManager
 */
export default class CommitGateManager implements Manager {
  protected held: [
    action: ActionTypes,
    settle: (result?: Promise<void>) => void,
  ][] = [];
  protected controller?: Controller;
  protected mounted?: Controller;

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => action => {
      // held results predate any reset, whichever store it reaches
      if (action.type === actionTypes.RESET) this.drop();
      if (
        controller === this.mounted ||
        action.type !== actionTypes.SET_RESPONSE
      )
        return next(action);
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
      // a throwing middleware rejects only its own result, not the rest
      settle(new Promise<void>(resolve => resolve(mounted.dispatch(action))));
    }
  }

  protected drop() {
    for (const [, settle] of this.held) settle();
    this.held = [];
  }
}
