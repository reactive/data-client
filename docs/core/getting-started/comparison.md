---
title: Comparison with other tools
sidebar_label: Comparison
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

While there are numerous tools for async state we could compare to, the libraries were chosen as
the strongest representation of their general approach.

[Rest Hooks' design](../README.md) is aimed at **treating remote data like it is local**. This means component logic should be no more complex than useState and setState. This design requires Rest Hooks to [automatically ensures safety and performance](../README.md#entities), rather than requiring
users to layer their own state manipulation logic.

From those adopting Rest Hooks we've seen

- Dramatic increase in developer velocity
- Elimination of networking related jank
- No more bug-whack-a-mole
- Improved learning curves - no need for expensive and time consuming courses
- Reduction in server load by overfetching improvements
- Navigational and interaction speed improvements

### Platforms

|                     |                                  [Rest Hooks](https://resthooks.io)                                   | [SWR](https://swr.vercel.app/) | [RTK-Query](https://redux-toolkit.js.org/rtk-query/overview) | [Apollo](https://www.apollographql.com/docs/react/) | [Relay](https://relay.dev/) |
| ------------------- | :---------------------------------------------------------------------------------------------------: | :----------------------------: | :----------------------------------------------------------: | :-------------------------------------------------: | :-------------------------: |
| Fetch Protocols     |      [REST](/rest), [GraphQL](/graphql), [img+binary](../guides/img-media.md), user-defined[^1]       |        user-defined[^1]        |                    REST, user-defined[^1]                    |                       GraphQL                       |           GraphQL           |
| Push Protocols      | [Websockets](../api//Manager.md#data-stream), [SSE](../api//Manager.md#data-stream), user-defined[^1] |               🛑               |                 Websockets, user-defined[^1]                 |                GraphQL subscriptions                |    GraphQL subscriptions    |
| Polling (hybrid)    |                                                  ✅                                                   |               🟡               |                              ✅                              |                         ✅                          |             ✅              |
| Offline persistence |                                          🟡 user-defined[^1]                                          |               🛑               |                     🟡 user-defined[^1]                      |                         ✅                          |             🛑              |
| View Library        |    React web, React Native, [NextJS](../guides/ssr#nextjs), [React SSR](../guides/ssr#express-js)     |           React web            |                      React web, Svelte                       |                      React web                      |   React web, React native   |

While the maintainers do check this from time to time, we encourage you to [fix any inaccuracies
on this table](https://github.com/data-client/rest-hooks/edit/master/docs/getting-started/comparison.md). Be sure to include
relevant links to docs as well as PRS for newly added features in the PR description.

We focus on _outcomes_ rather than _how_ they are achieved, as that can be somewhat subjective. Such
comparisons are useful but don't fit into a table of check boxes. For instance, a car missing a cassette tape player
but having bluetooth and internet streaming isn't necessarily worse than a car with just a tape player.

<!-- TODO: include code comparison for read and mutate -->

### Safety

|                                                     | Rest Hooks | SWR | RTK-Query | Apollo | Relay |
| --------------------------------------------------- | :--------: | :-: | :-------: | :----: | :---: |
| **Data Integrity**                                  |            |     |           |        |
| Typed returns                                       |     ✅     | 🛑  |    🛑     |        |
| Typed arguments                                     |     ✅     | 🛑  |    🛑     |        |
| Typed mutations                                     |     ✅     | 🛑  |    🛑     |        |
| [Validation](../concepts/validation.md)             |     ✅     | 🛑  |    🛑     |        |  🛑   |
| Global referential integrity                        |     ✅     | 🛑  |    🛑     |        |  🛑   |
| [Atomic mutations](../concepts/atomic-mutations.md) |     ✅     | 🛑  |    🛑     |        |  ✅   |
| Mutation isolation                                  |     ✅     | 🛑  |           |        |  ✅   |
| **Data Consistency**                                |            |     |           |        |
| No component tearing                                |     ✅     |     |           |        |  ✅   |
| No mutation flashes                                 |     ✅     | 🛑  |    🛑     |        |  ✅   |
| Across queries                                      |     ✅     | 🛑  |    🛑     |   ✅   |  ✅   |
| Fetch order protection                              |     ✅     | 🛑  |    🛑     |        |
| Entity ordering protection                          |     ✅     | 🛑  |    🛑     |        |
| **Relationships**                                   |            |     |           |        |
| one-to-one                                          |     ✅     | 🛑  |    🛑     |   ✅   |  ✅   |
| many-to-one                                         |     ✅     | 🛑  |    🛑     |   ✅   |  ✅   |
| many-to-many                                        |     🟡     | 🛑  |    🛑     |        |  ✅   |
| **Liveliness**                                      |            |     |           |        |
| [Expiry policy](../concepts/expiry-policy.md)       |     ✅     | 🛑  |    ✅     |        |

### Performance

|                                                        | Rest Hooks |                         SWR                         |                               RTK-Query                               | Apollo |                             Relay                             |
| ------------------------------------------------------ | :--------: | :-------------------------------------------------: | :-------------------------------------------------------------------: | :----: | :-----------------------------------------------------------: |
| Global cache                                           |     ✅     |                         ✅                          |                                  ✅                                   |   ✅   |                              ✅                               |
| Parallel fetches                                       |     ✅     |                         ✅                          |                                  ✅                                   |   ✅   |                              ✅                               |
| Reuse data from other fetch                            |     ✅     |                         🛑                          |                                  🛑                                   |   🛑   |                              🛑                               |
| Immediate updates                                      |     ✅     |                         🛑                          |                                  🛑                                   |   ✅   |                              ✅                               |
| Immediate deletes                                      |     ✅     |                         🛑                          |                                  🛑                                   |   ✅   |                              ✅                               |
| Immediate creates                                      |     ✅     |                         🛑                          |                                  🛑                                   |   ✅   |                              ✅                               |
| Optimistic Updates                                     |     ✅     |                         🛑                          |                  🟡 manual, race conditions, unsafe                   |   🟡   |                              ✅                               |
| Global referential integrity                           |     ✅     |                         🛑                          |                                  🛑                                   |   🛑   |                              🛑                               |
| **Concurrent mode support**                            |            |                                                     |                                                                       |        |
| Suspense                                               |     ✅     |                         ✅                          |                                  🛑                                   |   🛑   |                              ✅                               |
| useTransition                                          |     ✅     |                                                     |                                  🛑                                   |   🛑   |                              ✅                               |
| Deferred data                                          |     ✅     |                                                     |                                  🛑                                   |   🛑   |                              ✅                               |
| Fetch-while-render                                     |     ✅     |                         🛑                          |                                  🛑                                   |   🛑   |                              ✅                               |
| SSR                                                    |     ✅     |                         🛑                          |                                  ✅                                   |        |                              🛑                               |
| Streaming Server Rendering                             |     ✅     |                         🛑                          |                                  🛑                                   |        |                              🛑                               |
| Selective Hydration                                    |     ✅     |                         🛑                          |                                  🛑                                   |        |                              🛑                               |
| SSR primes cache                                       |     ✅     |                         🛑                          |                                  🛑                                   |        |                              🛑                               |
| **Bundle size**                                        |            |                                                     |                                                                       |        |
| Auto code split                                        |     ✅     |                         ✅                          |                                  🛑                                   |   🛑   |
| Entry Bundle (gzip)                                    |   7.8kb    | [4.1kb](https://bundlephobia.com/package/swr@2.0.0) | [17kb](https://redux-toolkit.js.org/rtk-query/comparison#bundle-size) | 27.9kb | [55.7kb](https://bundlephobia.com/package/react-relay@14.1.0) |
| **Overfetch elimination**                              |
| Auto fetch deduplication                               |     ✅     |                                                     |                                  ✅                                   |   ✅   |                              ✅                               |
| Nested data support                                    |     ✅     |                         🛑                          |                                  🛑                                   |   ✅   |                              ✅                               |
| [Client-side joins](/rest/api/Query#client-side-joins) |     ✅     |                         🛑                          |                                  🛑                                   |   🛑   |                              🛑                               |
| No overfetch on delete                                 |     ✅     |                         🛑                          |                                  🛑                                   |   ✅   |                              ✅                               |
| No overfetch on update                                 |     ✅     |                         🛑                          |                                  🟡                                   |   ✅   |                              ✅                               |
| No overfetch on create                                 |     ✅     |                         🛑                          |                                  🛑                                   |   ✅   |                              ✅                               |
| Zero fetch on SSR                                      |     ✅     |                         🛑                          |                                  🛑                                   |        |                              🛑                               |
| No polling overfetch                                   |     ✅     |                         🛑                          |                                  🛑                                   |        |

### Features

How quickly one can get started

|                                                                  |     Rest Hooks      | SWR | RTK-Query |       Apollo        | Relay |
| ---------------------------------------------------------------- | :-----------------: | :-: | :-------: | :-----------------: | :---: |
| Can use with redux                                               |         ✅          | 🛑  |    ✅     |         🛑          |  🛑   |
| [Infinite scrolling](/rest/guides/pagination#infinite-scrolling) |         ✅          | ✅  |    🛑     |         ✅          |
| [401 handling](../api/LogoutManager.md)                          |         ✅          | 🛑  |    🟡     |                     |  🛑   |
| Aborts                                                           |         ✅          | 🛑  |    🛑     |         🛑          |
| Arbitrary store queries                                          |         ✅          | 🛑  |    ✅     |                     |  🛑   |
| Debugging inspector                                              |         ✅          | 🛑  |    ✅     |         ✅          |  ✅   |
| Data mocking                                                     |         ✅          | 🛑  |    🛑     |         🛑          |  ✅   |
| [Storybook](../guides/storybook.md)                              |         ✅          | 🛑  |    🛑     |         🛑          |
| Retries                                                          | 🟡 user-defined[^1] | 🛑  |    ✅     | 🟡 user-defined[^1] |  🛑   |
| Declarative data transforms                                      |         ✅          | 🛑  |    🛑     |         🛑          |  🛑   |

### Extensibility

How well it scales as code size and usage increases

|                                  | Rest Hooks | SWR | RTK-Query | Apollo | Relay |
| -------------------------------- | :--------: | :-: | :-------: | :----: | :---: |
| [Middlewares](../api/Manager.md) |     ✅     | 🛑  |    ✅     |   🛑   |  🛑   |
| Abstracted/Agnostic Core         |     ✅     | 🛑  |    ✅     |   🛑   |  🛑   |
| **Composition**                  |            |     |           |        |
| Hook+API disjoint                |     ✅     | 🛑  |    🟡     |   🟡   |  🟡   |
| Fallback+dependency disjoint     |     ✅     | ✅  |    🛑     |   🛑   |  ✅   |
| Data+API disjoint                |     ✅     | 🛑  |    🛑     |   🛑   |  🛑   |
| Actions+API disjoint             |     ✅     | 🛑  |    🛑     |   🛑   |  🛑   |
| Data co-location                 |     ✅     | ✅  |    🛑     |   🛑   |  ✅   |
| **Code sharing**                 |            |     |           |        |       |
| Protocol hierarchy               |     ✅     | 🛑  |    🛑     |   ✅   |  ✅   |
| Data hierarchy                   |     ✅     | 🛑  |    🛑     |   🟡   |  🟡   |
| Resource                         |     ✅     | 🛑  |    🛑     |   🛑   |  🛑   |

[1]: `user-defined` means it has extensibility to support arbitrary user implementations, but does not ship with the library itself
