import {
  Controller,
  NetworkManager,
  initialState,
  createReducer,
  applyManager,
  initManager,
} from '@data-client/core';
import type { Manager } from '@data-client/core';

import { PromiseifyMiddleware } from './redux/index.js';
import { createStore, applyMiddleware } from './redux/redux.js';
import { NetworkManager as ReactNetworkManager } from '../managers/index.js';

/** Redux-style store for one server render; managers must include a NetworkManager */
export default function createServerStore(managers?: Manager[]) {
  const controller = new Controller();
  managers = managers ?? [new ReactNetworkManager()];
  const networkManager = managers.find(m => m instanceof NetworkManager) as
    NetworkManager | undefined;
  if (networkManager === undefined)
    throw new Error('managers must include a NetworkManager');
  const reducer = createReducer(controller);
  const enhancer = applyMiddleware(
    // redux 5's types are wrong and do not allow any return typing from next, which is incorrect.
    // `next: (action: unknown) => unknown`: allows any action, but disallows all return types.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ...applyManager(managers, controller),
    PromiseifyMiddleware,
  );
  const store = createStore(reducer, initialState as any, enhancer);
  initManager(managers, controller, store.getState())();
  return { store, controller, managers, networkManager };
}
