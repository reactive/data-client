# SSR and streamed hydration

Only what differs from a browser-only app. Components, hooks, Managers, and mutations are unchanged: `useSuspense` / `useLive` stay in the component that renders the data. The difference is how the store is seeded.

## Contents

- [Which entry](#which-entry)
- [Next.js App Router](#nextjs-app-router)
- [renderToPipeableStream (Express, Anansi)](#rendertopipeablestream-express-anansi)
- [Next.js Pages Router](#nextjs-pages-router)
- [Not shipped](#not-shipped)

## Which entry

| Host | Import | How the store is seeded |
| --- | --- | --- |
| Next.js App Router | `@data-client/react/nextjs` | Streamed: inert baseline in the shell, then a `StateDelta` per committed server revision, `HYDRATE`d into the live store |
| `renderToPipeableStream` (Express, Anansi) | `@data-client/react/ssr` | One-shot snapshot passed as `initialState` |
| Next.js Pages Router | `@data-client/ssr/nextjs` | One-shot snapshot |

Say **RSC** and **`renderToPipeableStream`**; do not use the React-internal names for those layers.

## Next.js App Router

```tsx title="app/layout.tsx"
import { DataProvider } from '@data-client/react/nextjs';
import { AsyncBoundary } from '@data-client/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DataProvider>
          <AsyncBoundary>{children}</AsyncBoundary>
        </DataProvider>
      </body>
    </html>
  );
}
```

Differences from the browser `DataProvider`:

- No `initialState` prop. The store is seeded from the stream; do not pass or replace state per delta.
- `managers` must be a **function**. The server builds a store per request, so an array is rejected. Server-side `cleanup()` is not run per request; do not hold resources in server managers. A function cannot cross the RSC boundary, so custom managers go in a `'use client'` wrapper:

```tsx title="app/Provider.tsx"
'use client';
import { getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';

const managers = () => [...getDefaultManagers(), new MyManager()];

export default function Provider({ children }: { children: React.ReactNode }) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
```

- `nonce` prop: state is streamed in inline `<script>` tags; pass your CSP nonce through.
- One `DataProvider` per document. Nested or sibling providers share the same streamed state.
- `gcPolicy` applies in the browser only.

How hydration flows:

1. The shell carries an inert baseline; first paint does not wait for Data Client.
2. Each later committed server revision emits a `StateDelta` via `useServerInsertedHTML()`. The client folds queued deltas into the hydration snapshot and dispatches `HYDRATE` into the live store from a layout effect.
3. If that fold already happened when a Client Component renders, `useSuspense` hits. If RSC starts the island first, a miss fetches like any client render. `useServerInsertedHTML` writes to the HTML stream; it does not order RSC.
4. `useLive` / `useSubscription` dispatch `SUBSCRIBE` after commit, same as the browser. `SUBSCRIBE` is not proof the server delta arrived.

Scope:

- Only the initial document is transferred. Client-side navigation and `router.refresh()` fetch in the browser.
- Partial Prerendering: the static shell's state is transferred; data fetched while resuming dynamic holes is fetched again in the browser.
- Server Components may `await TodoResource.getList(params)` directly. That result is rendered on the server and is not placed in the store.
- Production builds mangle class names: set `static key = 'User'` on every `Entity` (skill "data-client-schema").

## renderToPipeableStream (Express, Anansi)

One-shot snapshot. The server fetches into a per-request store, then serializes it once the tree is ready.

```tsx
import { renderToPipeableStream } from 'react-dom/server';
import { createPersistedStore, createServerDataComponent } from '@data-client/react/ssr';

const [ServerDataProvider, useReadyCacheState, controller] = createPersistedStore();
const ServerDataComponent = createServerDataComponent(useReadyCacheState);

controller.fetch(NeededForPage, { id: 5 });
renderToPipeableStream(
  <Document scripts={[<ServerDataComponent key="server-data" />]}>
    <ServerDataProvider>{children}</ServerDataProvider>
  </Document>,
  { onCompleteShell() { pipe(res); } },
);
```

```tsx
import { awaitInitialData } from '@data-client/react/ssr';

awaitInitialData().then(initialState => {
  hydrateRoot(root, <DataProvider initialState={initialState}>{children}</DataProvider>);
});
```

Streamed baseline + deltas are not available on this entry.

## Next.js Pages Router

`pages/_document.tsx` exports `DataClientDocument`; `pages/_app.tsx` wraps in `AppDataProvider`, both from `@data-client/ssr/nextjs`. One-shot snapshot. Override `DataClientDocument.getNonce(ctx)` for CSP. Pages reading `useRouter().query` need `getServerSideProps` (even `() => ({ props: {} })`) or the query is empty on first render.

## Not shipped

Do not describe these as current behavior:

- Per-key `useSuspense` waiters (suspend on a pending stream key instead of dispatching `FETCH`).
- Fold-on-script-arrival independent of the receiver layout effect.
- Streamed baseline + deltas for `@data-client/react/ssr` (Express, Anansi).

Consequence today: an RSC-first miss fetches like any client render. Do not work around it by replacing `initialState`, buffering the shell until all endpoints are known, or adding endpoint/schema options for streaming. A document-wide `DOMContentLoaded` wait is an acceptable interim, not the contract.
