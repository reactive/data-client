---
authors: [ntucker]
tags: [releases, rest-hooks]
title: Announcing Rest Hooks 2.0
---

We use [SemVer](https://semver.org/) for Rest Hooks - so 2.0 represents some breaking changes. To minimize disruption
we have been carefully considering these changes and awaiting community feedback to be confident
these are the right changes to make.

While some of these changes are simple renames to make the library more intuitive - some represent
important progress to empowering the next chapter of Rest Hooks.

See https://github.com/coinbase/rest-hooks/releases/tag/2.0.0 for a complete list of changes

<!--truncate-->

## Breaking changes

Rest Hooks 2.0 mostly represents breaking changes. While some of these provide new functionality
or capabilities, purely additive features will come in subsequent releases.

### Renaming

#### RestProvider -> CacheProvider

The core provider has been renamed appropriately to represent what it actually does - manage
the cache. Since Rest Hooks is **protocol agnostic** by design it was not only misleading as name
but also didn't sufficiently express what the provider is actually _providing_.

#### RequestShape -> FetchShape

[FetchShape](/docs/2.2/api/FetchShape) is the core interface that enables Rest Hooks to be both
**declarative**, **performant** and **protocol agnostic**. The previous `Request` terminology
only represented one-side of the entire request/response pattern in fetch. This did not comprehensively
encapsulate the entirety of what it provided - thus we changed the name to `FetchShape` to capture
the full cycle of behavior - from request all the way to handling the response that it provides.

#### Resource `FetchShape` generators

Along the same lines, the provided static methods in [Resource](/docs/2.2/api/resource) that return `FetchShapes`
need to accurately describe their return value. As such, the suffix has changed from `Request` to `Shape`. Also,
the request for getting a singular entity - typically using a lookup id - has had its prefix changed
from `single` to `detail` to better reflect common `REST` terminology.

- singleRequest() -> detailShape()
- listRequest() -> listShape()
- createRequest() -> createShape()
- updateRequest() -> updateShape()
- partialUpdateRequest() -> partialUpdateShape()
- deleteRequest() -> deleteShape()

#### Schema types

Previously there were two generic used to distinguish between `Schema`s that return a single item and many to
mark the expected return values of `detailShape()` and `listShape()`. Their names have been changed
to be consistent with the new naming. `SchemaBase` is now `SchemaDetail` and `SchemaArray` is now
`SchemaList`.

### Extensibility

A core tenant of Rest Hooks' design is to be flexible to match diverse use cases. Along those
lines, some key improvements were made to enable easier extensibility and customization that will
empower the next wave of applications using Rest Hooks.

#### CacheProvider and Managers

The [Manager](/docs/2.2/api/Manager) abstraction has existed since the beginning of Rest Hooks. The first Manager - [NetworkManager](/docs/2.2/api/NetworkManager)
orchestrated the complex world of fetching. It provided performance optimizations like fetch deduplication
while providing Suspense promise resolution free of race conditions. This enabled the consistent bug-free behavior
of Rest Hooks while maintaining its minimal bundle footprint. Later the [SubscriptionManager](/docs/2.2/api/SubscriptionManager) was added
to enable keeping resources fresh.

However, it quickly became clear that this was only the beginning. To enable the next generation of
Managers, [CacheProvider](/docs/2.2/api/CacheProvider) now takes an [array of managers](/docs/2.2/api/CacheProvider#managers-manager)
as a prop. As an undocumented behavior, the NetworkManager and SubscriptionManager
could previously be passed as arguments to customize their configuration. Instead
you can now override their defaults by sending both managers. Or build your own Managers
to be used as well.

#### Protocol Agnostic

Initially, FetchShape included a member to get the url (`getUrl()`). This was used to both
provide a lookup key for the results of a request as well as generate the url to send
to `fetch()` using an object of params like `{ id: 5 }`. This made it easy to override
just the url portion of a shape for custom endpoints.

However, for protocols that don't base their requests on url like GraphQL this was a bit
awkward. Additionally, manipulating the request/response based on fetch params [became
cumbersome when the fetch method had to parse the url](https://github.com/coinbase/rest-hooks/issues/87)
instead of just access those params itself.

- [getUrl() -> getFetchKey() + fetch()](/docs/2.2/guides/endpoints#rpc)
  - If you were setting getUrl() before, you'll need to also override the [FetchShape.fetch()](/docs/2.2/api/FetchShape#fetchparams-param-body-payload-promise-any). getFetchKey() is only used as a lookup
  key in the results table cache. [FetchShape.fetch()](/docs/2.2/api/FetchShape#fetchparams-param-body-payload-promise-any)
  is responsible for constructing the actual url.

- fetch(url: string, body: Body) -> fetch(params: Params, body: Body)

#### Hook composition

One of the biggest benefits of hooks is enabling composition of behavior via isolation of
concerns. Even the highest level hooks in Rest Hooks have always been simply compositions of
other lower level hooks. However, without clear use cases of reuse - these lower level hooks
sometimes crossed appropriate abstraction boundaries.

One of these cases is the `useError()` hook, which now returns an error if one is found or
undefined otherwise. Previously it had been throwing the error itself, which made it awkward
to use outside the context of Error Boundaries
(e.g., [useStatefulResource](/docs/2.2/guides/no-suspense#usestatefulresourcetsx)).

### Featherweight bundles

Keeping Rest Hooks bundle footprint small has been a conscious effort - enabled mostly
by clean modular design. Sometimes this has to be balanced with maximum compatibility.
Keeping this in mind, Rest Hooks will now leave polyfill loading up to the user. Instead
of importing the polyfills it needs from core-js directly, it will assume they are loaded.
**This means when using Rest Hooks 2.0 with the intent of IE compatibility - you will need
to ensure you are loading the appropriate polyfills yourself.**

Leaving polyfills in the control of the application builder seems like the best practice
for libraries. This also means an application can potentially only load polyfills if they
are needed.

## Migration guide

To summarize:

- RestProvider -> CacheProvider
- RequestShape -> FetchShape
- singleRequest() -> detailShape()
- listRequest() -> listShape()
- createRequest() -> createShape()
- updateRequest() -> updateShape()
- partialUpdateRequest() -> partialUpdateShape()
- deleteRequest() -> deleteShape()
- `<CacheProvider manager={myNetworkManager} subscriptionManager={mySubcriptionManager}>` -> `<CacheProvider managers={[myNetworkManager, mySubscriptionManager]}>`
- [FetchShape.getUrl() -> FetchShape.getFetchKey() + FetchShape.fetch()](/docs/2.2/guides/endpoints#rpc)
- FetchShape.fetch(url: string, body: Body) -> FetchShape.fetch(params: Params, body: Body)
- SchemaBase -> SchemaDetail; SchemaArray -> SchemaList
- useError() returns error instead of throwing
- Polyfills are not included automatically

## What's next

While an important milestone for Rest Hooks, work is far from over. We have some exciting
features planned to be released soon. Here's a sneak peak of the 'soon' lineup:

- Garbage collection
- [Optimistic query update on create](https://github.com/coinbase/rest-hooks/issues/96)
- Automatic query batching
- Caching in Service Workers (PWA)
- Server Side Rendering guide
- Concurrent mode test suite

We're also experimenting with a CLI to generate [Resource](/docs/2.2/api/resource) stubs from OpenAPI
schemas.

If any of these ideas excite you, or you have ideas of your own for Rest Hooks, we encourage you
to share your feedback by [creating an issue](https://github.com/coinbase/rest-hooks/issues/new/choose)
or [contributing code](https://github.com/coinbase/rest-hooks/compare).
