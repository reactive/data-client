---
name: data-client-ssr
description: Stream and incrementally hydrate @data-client SSR state — baseline plus StateDelta on Next.js App Router, HYDRATE, subscribe-after-commit. Use when implementing or debugging SSR, RSC, Next App Router, renderToPipeableStream, Anansi, or duplicate REST after HTML already contains the data.
license: Apache 2.0
---

# Streamed SSR hydration

The Next.js App Router store hydrates incrementally. G0 is an inert baseline in the shell. Each later server revision is a StateDelta. The client folds queued pieces into the hydration snapshot and HYDRATE the live store from StreamedStateReceiver’s layout effect. SUBSCRIBE after commit starts live transport only.

Per-key useSuspense waiters and fold-on-script-arrival (independent of that layout effect) are **not shipped**. A miss while Flight races the HTML delta fetches like any client render.

Canonical sequence: docs/guides/ssr.md#streamed-hydration (what ships vs intended client clock).

## Do

- Put Next DataProvider in the root layout. managers={() => [...getDefaultManagers(), ...]} — never a shared array on the Next entry.
- Keep useSuspense / useLive in the island that renders the data. Same as CSR.
- Let NetworkManager handle in-flight client FETCH only. Do not expect it to dedupe against SSR.

## Do not

- Replace DataProvider initialState on each delta.
- Treat useServerInsertedHTML as ordering state before Flight.
- Use SUBSCRIBE to mean “SSR data is here.”
- Add endpoint/schema options for streaming.
- Buffer the shell, HTML, or Flight until all endpoints are known.

A document-wide DOMContentLoaded wait is an acceptable **interim** while per-key waiters are unshipped. It is not the long-term contract, and it is not required as the sole fix.

## Adapters

- Next: @data-client/react/nextjs — insertion via useServerInsertedHTML; live HYDRATE from the receiver layout effect.
- Generic: @data-client/react/ssr — still a one-shot document snapshot (useReadyCacheState / awaitInitialData). Incremental baseline+delta is not shipped here.
- Anansi: leave the one-shot initData.dataclient path.

## Open questions (future client-clock work)

- Per-key waiters on useSuspense would-fetch, and fold-on-script-arrival independent of StreamedStateReceiver.
- Next 16 Flight-first race (refetch while SSR HTML is visible) remains open until that clock lands. Expiry windows cannot repair a FETCH already started from G0.
- Incremental baseline+delta for generic Fizz / Anansi.
