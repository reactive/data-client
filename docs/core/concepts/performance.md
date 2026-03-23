---
title: Performance
sidebar_label: Performance
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>


[Normalized caching](./normalization.md) with entity-level memoization enables
significant performance gains for rich interactive applications.


## React rendering benchmarks

Full rendering pipeline (fetch through paint) measured in a real browser via Playwright.
React baseline uses useEffect + useState from the React docs.

<center>

<ThemedImage
alt="React Rendering Benchmarks"
title="Data Client vs TanStack Query, SWR, and Baseline"
sources={{
    light: useBaseUrl('/img/bench-react.svg'),
    dark: useBaseUrl('/img/bench-react-dark.svg'),
  }}
/>

[View benchmark source](https://github.com/reactive/data-client/tree/master/examples/benchmark-react) · [Performance over time](https://reactive.github.io/data-client/react-bench/)

</center>

- **Cached Navigation**: Navigating between a full list and items in the list ten times.
- **Mutation Propagation**: One store write updates every view that references the entity.
- **Scaling**: Mutations with 10k items in the list rendered.



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

[View benchmark source](https://github.com/reactive/data-client/blob/master/examples/benchmark)

</center>