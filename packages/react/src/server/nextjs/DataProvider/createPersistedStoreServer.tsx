import {
  Controller,
  Manager,
  NetworkManager,
  State,
  createReducer,
  initialState,
  applyManager,
  DevToolsManager,
} from '@data-client/core';
import type { ComponentProps } from 'react';

import type DataProvider from '../../../components/DataProvider.js';
import { NetworkManager as ReactNetworkManager } from '../../../managers/index.js';
import { PromiseifyMiddleware } from '../../redux/index.js';
import { createStore, applyMiddleware } from '../../redux/redux.js';
import SSRDataProvider from '../../SSRDataProvider.js';

export default function createPersistedStore(managers?: Manager[]) {
  const controller = new Controller();
  managers = managers ?? [new ReactNetworkManager()];
  const networkManager: NetworkManager = managers.find(
    m => m instanceof NetworkManager,
  ) as any;
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
  const { getState, dispatch, subscribe } = createStore(
    reducer,
    initialState as any,
    enhancer,
  );
  managers.forEach(manager => manager.init?.(getState()));

  const initPromise: Promise<State<any>> = (async () => {
    let firstRender = true;

    while (true) {
      const inFlightFetches = networkManager.allSettled();
      if (inFlightFetches) {
        firstRender = false;
        await inFlightFetches;
        continue;
      }
      if (firstRender) {
        firstRender = false;
        // TODO: instead of waiting 10ms - see if we can wait until next part of react is streamed and race with networkManager getting new fetches
        await new Promise(resolve => setTimeout(resolve, 10));
        continue;
      }
      break;
    }
    return getState();
  })();

  const StoreDataProvider = ({
    children,
    devButton,
    managers,
  }: ProviderProps) => {
    // only include if they have devtools integrated
    // if managers isn't overridden we know it will by default include DevToolsManager, so set this to true
    const hasDevManager =
      !managers ||
      !!managers.find(manager => manager instanceof DevToolsManager);
    return (
      <SSRDataProvider
        getState={getState}
        subscribe={subscribe}
        dispatch={dispatch}
        devButton={devButton}
        hasDevManager={hasDevManager}
      >
        {children}
      </SSRDataProvider>
    );
  };

  return [StoreDataProvider, initPromise] as const;
}

type ProviderProps = Omit<
  Partial<ComponentProps<typeof DataProvider>>,
  'initialState'
> & {
  children: React.ReactNode;
  initPromise: Promise<State<any>>;
};
