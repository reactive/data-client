# useEnhancedReducer() - middlewares for React Hooks flux stores

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/use-enhanced-reducer.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/use-enhanced-reducer)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/use-enhanced-reducer?style=flat-square)](https://bundlephobia.com/result?p=@data-client/use-enhanced-reducer)
[![npm version](https://img.shields.io/npm/v/@data-client/use-enhanced-reducer.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/use-enhanced-reducer)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

`useEnhancedReducer()` empowers building complex orchestration into flux stores built using React Hooks.

#### `loggerMiddleware.ts`

```typescript
import { MiddlewareAPI, Dispatch } from '@data-client/use-enhanced-reducer';

export default function loggerMiddleware<R extends React.Reducer<any, any>>({
  getState,
  dispatch,
}: MiddlewareAPI<R>) {
  return (next: Dispatch<R>) => async (action: React.ReducerAction<R>) => {
    console.group(action.type);
    console.log('before', getState());
    await next(action);
    console.log('after', getState());
    console.groupEnd();
  };
}
```

#### `CacheProvider.tsx`

```tsx
import {
  useEnhancedReducer,
  Middleware,
} from '@data-client/use-enhanced-reducer';

interface ProviderProps {
  children: ReactNode;
  middlewares: Middleware[];
  initialState: State<unknown>;
}

export default function CacheProvider({
  children,
  middlewares,
  initialState,
}: ProviderProps) {
  const [state, dispatch] = useEnhancedReducer(
    masterReducer,
    initialState,
    middlewares,
  );

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}
```

## Middleware Examples

- Reactive Data Client's [NetworkManager](https://github.com/reactive/data-client/blob/master/packages/data-client/src/state/NetworkManager.ts)
- Reactive Data Client's [PollingSubscription](https://github.com/reactive/data-client/blob/master/packages/data-client/src/state/PollingSubscription.ts)
- [LogoutManager](https://dataclient.io/docs/api/LogoutManager)
- [StreamManager](https://github.com/reactive/data-client/blob/master/examples/coin-app/src/resources/StreamManager.ts) a websocket stream for cryptocurrency prices. [![Sandbox](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/reactive/data-client/tree/master/examples/coin-app?hidedevtools=1&terminalHeight=0&file=src%2Findex.tsx%2Csrc%2Fresources%2FTicker.ts%2Csrc%2Fpages%2FHome%2FAssetPrice.tsx%2Csrc%2Fresources%2FStreamManager.ts)