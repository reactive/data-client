---
title: '<CacheProvider />'
---

```typescript
interface ProviderProps {
  children: ReactNode;
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof Controller;
}
```

Manages state, providing all context needed to use the hooks. Should be placed as high as possible
in application tree as any usage of the hooks is only possible for components below the provider
in the React tree.

```tsx title="index.tsx"
import { CacheProvider } from '@rest-hooks/react';
import ReactDOM from 'react-dom';

ReactDOM.createRoot(document.body).render(
  <CacheProvider>
    <App />
  </CacheProvider>,
);
```

## initialState: State<unknown\> {#initialState}

```typescript
type State<T> = Readonly<{
  entities: Readonly<{ [fetchKey: string]: { [pk: string]: T } | undefined }>;
  results: Readonly<{ [url: string]: unknown | PK[] | PK | undefined }>;
  meta: Readonly<{
    [url: string]: { date: number; error?: Error; expiresAt: number };
  }>;
}>;
```

Instead of starting with an empty cache, you can provide your own initial state. This can
be useful for testing, or rehydrating the cache state when using server side rendering.

## managers: Manager[] {#managers}

Default:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

List of [Manager](./Manager)s use. This is the main extensibility point of the provider.

## Controller: typeof Controller {#Controller}

This allows you to extend [Controller](./Controller.md) to provide additional functionality.
This might be useful if you have additional actions you want to dispatch to custom [Managers](./Manager.md)

```tsx
class MyController extends Controller {
  doSomething = () => {
    console.log('hi');
  };
}

const RealApp = (
  <CacheProvider Controller={MyController}>
    <App />
  </CacheProvider>
);
```
