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
| Browser SPA | `@data-client/react` | Public `DataProvider`; hooks read `StateContext` |
| Next.js App Router | `@data-client/react/nextjs` | Adapter-owned streamed snapshot: inert baseline in the shell, then a `StateDelta` per committed server revision |
| `renderToPipeableStream` (Express, Anansi) | `@data-client/react/ssr` | One-shot snapshot passed as `initialState`. Unstable `__INTERNAL__.StreamingDataProvider` if the host already owns a snapshot store |
| Next.js Pages Router | `@data-client/ssr/nextjs` | One-shot snapshot |

Do not dispatch a root `HYDRATE` action. Stream publication is adapter-internal.

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
2. Each later committed server revision emits a `StateDelta` via `useServerInsertedHTML()`. The Next.js adapter folds queued deltas into its snapshot and publishes them into the live store from a layout effect.
3. If that fold already happened when a Client Component renders, `useSuspense` hits. If RSC starts the island first, a miss fetches like any client render. `useServerInsertedHTML` writes to the HTML stream; it does not order RSC.
4. `SUBSCRIBE` from `useLive` / `useSubscription` is not proof the server delta arrived.

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

A stable streamed baseline + deltas API is not available on this entry. Hosts that already own a snapshot store can compose `__INTERNAL__.StreamingDataProvider` from `@data-client/react/ssr`; that namespace is unstable and is not a user-facing component.

## Next.js Pages Router

`pages/_document.tsx` exports `DataClientDocument`; `pages/_app.tsx` wraps in `AppDataProvider`, both from `@data-client/ssr/nextjs`. One-shot snapshot. Override `DataClientDocument.getNonce(ctx)` for CSP. Pages reading `useRouter().query` need `getServerSideProps` (even `() => ({ props: {} })`) or the query is empty on first render.

## Not shipped

Do not describe these as current behavior:

- Per-key `useSuspense` waiters (suspend on a pending stream key instead of dispatching `FETCH`).
- Fold-on-script-arrival independent of the receiver layout effect.
- A render-pure revision-visibility protocol: progressively revealed islands still cannot read their server revision through `StateContext` without a live store identity change.
- Schema-aware live merge of streamed slots (`writeDelta` is whole-slot skip/replace) and reset-aware snapshot overlay (`lastReset`).
- A stable streamed baseline + deltas export on `@data-client/react/ssr`.

Consequence today: an RSC-first miss fetches like any client render. Per-delta live publication remains `flushSync` from the receiver. Missing-baseline still suspends while the document is loading. Do not work around these by replacing `initialState`, buffering the shell until all endpoints are known, adding endpoint/schema options for streaming, or dispatching a root hydrate action. A document-wide `DOMContentLoaded` wait is an acceptable interim, not the contract.
