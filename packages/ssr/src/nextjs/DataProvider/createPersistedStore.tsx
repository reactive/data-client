import {
  ExternalCacheProvider,
  PromiseifyMiddleware,
  Controller,
  Manager,
  NetworkManager,
  State,
  __INTERNAL__,
} from '@data-client/redux';
import { createStore, applyMiddleware } from 'redux';

const { createReducer, initialState, applyManager } = __INTERNAL__;

export default function createPersistedStore(managers?: Manager[]) {
  const controller = new Controller();
  managers = managers ?? [new NetworkManager()];
  const nm: NetworkManager = managers.find(
    m => m instanceof NetworkManager,
  ) as any;
  if (nm === undefined)
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
  managers.forEach(manager => manager.init?.(store.getState()));

  const selector = (state: any) => state;

  const getState = () => selector(store.getState());

  const initPromise: Promise<State<any>> = (async () => {
    let firstRender = true;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const inFlightFetches = nm.allSettled();
      if (inFlightFetches) {
        firstRender = false;
        await inFlightFetches;
        continue;
      }
      if (firstRender) {
        firstRender = false;
        // TODO: instead of waiting 10ms - see if we can wait until next part of react is streamed and race with nm getting new fetches
        await new Promise(resolve => setTimeout(resolve, 10));
        continue;
      }
      break;
    }
    return getState();
  })();

  function ServerCacheProvider({ children }: { children: React.ReactNode }) {
    return (
      <ExternalCacheProvider
        store={store}
        selector={selector}
        controller={controller}
      >
        {children}
      </ExternalCacheProvider>
    );
  }
  return [ServerCacheProvider, initPromise, controller, store] as const;
}
