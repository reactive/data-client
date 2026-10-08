---
title: Performance
sidebar_label: Performance
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>


In addition to the data integirty benefits, [normalized caching](./normalization.md) with entity-level memoization enables
significant performance gains for rich interactive applications.

## React rendering benchmarks

Full rendering pipeline (fetch through DOM commit) measured in a real browser via Playwright.[^setup]
React baseline uses useEffect + useState from the React docs.[^config]

<center>

<ThemedImage
alt="React Rendering Benchmarks"
title="Data Client vs TanStack Query, SWR, and Baseline"
sources={{
    light: useBaseUrl('/img/bench-react.svg'),
    dark: useBaseUrl('/img/bench-react-dark.svg'),
  }}
/>

[View benchmark source](https://github.com/reactive/data-client/tree/master/examples/benchmark-react) · [Methodology and raw results](./benchmark-methodology.md) · [Performance over time](https://reactive.github.io/data-client/react-bench/)

</center>

- **Cached Navigation**: Navigating between a full list and items in the list ten times.[^nav]
- **Mutation Propagation**: One store write updates every view that references the entity.[^mutation]
- **Scaling**: Mutations with 10k items in the list rendered.[^scaling]

These benchmarks measure the framework's impact within the larger system. That
makes them most useful as comparisons between approaches, rather than as
absolute measurements of an application's overall performance. We use them to
guide library optimizations and catch performance regressions over time.

[^setup]: Measured 2026-03-22 on a Ryzen 9 7950X (64 GB, Ubuntu on WSL2, Node 24.12.0, headless Chromium from Playwright 1.58.2), each request delayed 40 ms plus 1 ms per 20 records. Medians of 3 to 20 samples per scenario after warmup. [Full methodology](./benchmark-methodology.md).
[^config]: TanStack Query 5.62.7 (`staleTime` and `gcTime` set to `Infinity`), SWR 2.4.1 (revalidation on focus, reconnect and stale disabled), React 19.2.3. After a mutation, TanStack Query and SWR wait for the response and then invalidate and refetch; Data Client updates the store optimistically. [Configuration details](./benchmark-methodology.md#how-each-library-is-configured).
[^nav]: `list-detail-switch-10`: 57.5 ms for Data Client, 610 ms TanStack Query, 629 ms SWR, 1,370 ms baseline. That is 23.8× the baseline and about 11× TanStack Query and SWR.
[^mutation]: `update-entity`: 1.5 ms for Data Client, 143 ms TanStack Query, 141 ms SWR, 138 ms baseline. Other mutation scenarios range from 48× to 116× the baseline. [All results](./benchmark-methodology.md#results).
[^scaling]: `update-user-10000`: 6.9 ms for Data Client, 671 ms TanStack Query, 641 ms SWR, 641 ms baseline.

## Normalization benchmarks

Denormalization compared with the legacy [normalizr](https://github.com/paularmstrong/normalizr)
library. Entity-level memoization maintains global referential equality and
speeds up repeated access, including after [mutations](../getting-started/mutations.md).

<center>

<ThemedImage
alt="Denormalization Benchmarks"
title="Data Client vs normalizr"
sources={{
    light: useBaseUrl('/img/bench-norm.svg'),
    dark: useBaseUrl('/img/bench-norm-dark.svg'),
  }}
/>

[View benchmark source](https://github.com/reactive/data-client/blob/master/examples/benchmark) · [Methodology](./benchmark-methodology.md#normalization-benchmarks)

</center>