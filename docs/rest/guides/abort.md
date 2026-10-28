---
title: Aborting Fetch
---

import UseCancelling from '../../core/shared/\_useCancelling.mdx';

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) provides a new way of cancelling
fetches that are no longer considered relevant. This can be hooked into fetch via the second `RequestInit` parameter.

## Cancelling on params change

When params change quickly, like a reader skimming an inbox, every message they pass starts a download.
Each response is stored under its own params, so a late one never replaces what's on screen. But the
downloads they've left behind keep going, sharing a slow connection with the one they actually want.

[useCancelling()](/docs/api/useCancelling) aborts the in-flight request as soon as the params change, so
the message the reader stops on downloads alone.

<UseCancelling />

:::warning[Warning]

Be careful when using this with many disjoint components fetching the same
arguments (Endpoint/params pair) to useSuspense(). This solution aborts fetches per-component,
which means you might end up canceling a fetch that another component still cares about.

:::
