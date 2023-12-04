---
title: Aborting Fetch
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import UseCancelling from '../../core/shared/\_useCancelling.mdx';

[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) provides a new way of cancelling
fetches that are no longer considered relevant. This can be hooked into fetch via the second `RequestInit` parameter.

## Cancelling on params change

Sometimes a user has the opportunity to fill out a field that is used to affect the results of a network call.
If this is a text input, they could potentially type quite quickly, thus creating a lot of network requests.

Using [@data-client/hooks](https://www.npmjs.com/package/@data-client/hooks) package with [useCancelling()](/docs/api/useCancelling) will automatically cancel in-flight requests if the parameters
change before the request is resolved.

<UseCancelling />

:::warning Warning

Be careful when using this with many disjoint components fetching the same
arguments (Endpoint/params pair) to useSuspense(). This solution aborts fetches per-component,
which means you might end up canceling a fetch that another component still cares about.

:::
