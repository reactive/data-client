# ![🛌🎣 Rest Hooks Legacy](https://raw.githubusercontent.com/coinbase/rest-hooks/master/packages/rest-hooks/rest_hooks_logo_and_text.svg?sanitize=true)
[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/coveralls/coinbase/rest-hooks.svg?style=flat-square)](https://coveralls.io/github/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/legacy.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/legacy)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/legacy?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/legacy)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/legacy.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/legacy)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)



#### `CacheProvider.tsx`

```tsx
import { useEnhancedReducer, Middleware } from '@rest-hooks/use-enhanced-reducer';

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
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
```
