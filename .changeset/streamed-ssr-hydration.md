---
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': patch
---

Fix Next.js App Router streaming losing data fetched after the shell

`DataProvider` from `@data-client/react/nextjs` snapshotted the store a fixed 10ms after
rendering began. Any Client Component below an `async` Server Component (one that awaits
`params`, a database call, auth) rendered after that window, so its data reached the browser as
HTML but not as store state, and every such component fetched again on load.

The store is now streamed alongside the HTML: the shell carries the state so far and each later
flush prepends what changed since. Components that render late hydrate from exactly the data they
were rendered with, with no client requests for data already on the page.

Hooks also no longer produce a hydration mismatch when the store changes (a WebSocket or polling
`Manager`, a mutation) before a late `Suspense` boundary hydrates: hydration reads the state the
server rendered with, then the component converges to the live store.

```tsx title="app/layout.tsx"
import { DataProvider } from '@data-client/react/nextjs';

export default async function RootLayout({ children }) {
  // pass a nonce when your Content-Security-Policy requires one
  return <DataProvider nonce={nonce}>{children}</DataProvider>;
}
```

New exports:

- `actionTypes.HYDRATE` / `HydrateAction` – merges streamed server state into the client store
- `StateDelta` and `StateBaseline` – the serializable state changes carried by `HydrateAction` and
  what the client previously held for those slots
- `NextDataProviderProps` from `@data-client/react/nextjs`

`ActionTypes` now includes `HydrateAction`. Custom `Manager` middleware that narrows action
types with an exhaustive `switch` needs a case for it or a `default` branch.
