---
author: Nathaniel Tucker
authorURL: https://twitter.com/npinp
authorFBID: 7941978
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

[FetchShape](/docs/api/fetchshape) is the core interface that enables Rest Hooks to be both
**declarative**, **performant** and **protocol agnostic**. The previous `Request` terminology
only represented one-side of the entire request/response pattern in fetch. This did not comprehensively
encapsulate the entirety of what it provided - thus we changed the name to `FetchShape` to capture
the full cycle of behavior - from request all the way to handling the response that it provides.

#### Resource `FetchShape` generators

Along the same lines, the provided static methods in [Resource](/docs/api/resource) that return `FetchShapes`
need to accurately describe their return value. As such, the suffix has changed from `Request` to `Shape`. Also,
the request for getting a singular entity - typically using a lookup id - has had its prefix changed
from `single` to `detail` to better reflect common `REST` terminology.

- singleRequest() -> detailShape()
- listRequest() -> listShape()
- createRequest() -> createShape()
- updateRequest() -> updateShape()
- partialUpdateRequest() -> partialUpdateShape()
- deleteRequest() -> deleteShape()

### Extensibility

A core tenant of Rest Hooks' design is to be flexible to match diverse use cases. Along those
lines, some key improvements were made to enable easier extensibility and customization that will
empower the next wave of applications using Rest Hooks.

#### CacheProvider and Managers

The [Manager]() abstraction has existed since the beginning of Rest Hooks. The first Manager - [NetworkManager](/docs/api/NetworkManager)
orchestrated the complex world of fetching. It provided performance optimizations like fetch deduplication
while providing Suspense promise resolution free of race conditions. This enabled the consistent bug-free behavior
of Rest Hooks while maintaining its minimal bundle footprint. Later the [SubscriptionManager](/docs/api/SubscriptionManager) was added
to enable keeping resources fresh.

However, it quickly became clear that this was only the beginning. To enable the next generation of
Managers, [CacheProvider](/docs/api/CacheProvider) now takes an [array of managers](/docs/api/CacheProvider#managers-manager)
as a prop. As an undocumented behavior, the NetworkManager and SubscriptionManager
could previously be passed as arguments to customize their configuration. Instead
you can now override their defaults by sending both managers. Or build your own Managers
to be used as well.

#### Protocol Agnostic

[todo]

##### getUrl() -> getFetchKey()

- graphql and grpc - while possible, kinda awkward since they don't use urls

##### fetch(url: string, body: Body) -> fetch(params: Params, body: Body)

- using parameters to build response awkward as it had to be parsed from the url (https://github.com/coinbase/rest-hooks/issues/87)

#### Hook composition

One of the biggest benefits of hooks is enabling composition of behavior via isolation of
concerns. Even the highest level hooks in Rest Hooks have always been simply compositions of
other lower level hooks. However, without clear use cases of reuse - these lower level hooks
sometimes crossed appropriate abstraction boundaries.

One of these cases is the `useError()` hook, which now returns an error if one is found or
undefined otherwise. Previously it had been throwing the error itself, which made it awkward
to use outside the context of Error Boundaries
(e.g., [useStatefulResource](/docs/guides/no-suspense#usestatefulresourcetsx)).

### Simple and DRY

[todo] - useResultCache()

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
- FetchShape.getUrl() -> FetchShape.getFetchKey()
- FetchShape.fetch(url: string, body: Body) -> FetchShape.fetch(params: Params, body: Body)
- useError() returns error instead of throwing
- polyfills are not included automatically

## What's next

- Garbage collection
- [Optimistic query update on create](https://github.com/coinbase/rest-hooks/issues/96)
- Automatic query batching
- Configurable cache persistance (PWA)
- Server Side Rendering guide
- Concurrent mode test suite

- cli

## Call to action

[todo]
