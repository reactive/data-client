---
name: data-client-ssr
description: Stream and incrementally hydrate @data-client SSR state — baseline plus StateDelta, Next.js App Router and generic Fizz, useSuspense waiters, HYDRATE, subscribe-after-commit. Use when implementing or debugging SSR, RSC, renderToPipeableStream, Anansi, or duplicate REST after HTML already contains the data.
license: Apache 2.0
---

# Streamed SSR hydration

The store hydrates incrementally. G0 is an inert baseline in the shell. Each later server revision is a StateDelta. Fold it into the hydration snapshot (and HYDRATE the live store if attached) before that island’s useSuspense() would fetch. A miss while the initial stream is open waits on that endpoint key. SUBSCRIBE after commit starts live transport only.

Canonical sequence: docs/guides/ssr.md#streamed-hydration (batch, nested out-of-order, overlapping entity, Flight-first waiter).

## Do

- Put Next DataProvider in the root layout. managers={() => [...getDefaultManagers(), ...]} — never a shared array on the Next entry.
- Keep useSuspense / useLive in the island that renders the data. Same as CSR.
- Close the generic Fizz coordinator from renderer complete/abort. Do not wait onAllReady to emit state.
- Let NetworkManager handle in-flight client FETCH only. Do not expect it to dedupe against SSR.

## Do not

- Wait for DOMContentLoaded (or the first/last delta) before creating the provider or folding pieces.
- Replace DataProvider initialState on each delta.
- Treat useServerInsertedHTML as ordering state before Flight.
- Use SUBSCRIBE to release a REST waiter or to mean “SSR data is here.”
- Add endpoint/schema options for streaming. The waiter is internal to useSuspense’s would-fetch path.
- Intercept controller.fetch(), useFetch(), useDLE(), or mutations. Only useSuspense would-fetch (including useLive) throws the waiter.
- Buffer the shell, HTML, or Flight until all endpoints are known.

## Adapters

- Next: @data-client/react/nextjs — insertion via useServerInsertedHTML; stream-close may be DOMContentLoaded for leftover misses only.
- Generic: @data-client/react/ssr — colocate state-pieces in Suspense/island boundaries; explicit close.
- Anansi: replace the one-shot initData.dataclient path; leave unrelated JSONSpout one-shot.

## Proof vs product

A Next 16 Flight-first consumer that refetches while SSR HTML is visible is a broken waiter/fold (any generation), not a reason to gate the document. Expiry windows (even ten years) cannot repair a FETCH already started from G0.
