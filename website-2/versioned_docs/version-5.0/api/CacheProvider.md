---
title: "<CacheProvider />"
---

```typescript
interface ProviderProps {
  children: ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
}
```

Manages state, providing all context needed to use the hooks. Should be placed as high as possible
in application tree as any usage of the hooks is only possible for components below the provider
in the React tree.

`index.tsx`

```tsx
import { CacheProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <CacheProvider>
    <App />
  </CacheProvider>,
  document.body
);
```

## initialState: State\<unknown\>

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

## managers: Manager[]

Default:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)]
```

List of [Manager](./Manager)s use. This is the main extensibility point of the provider.
