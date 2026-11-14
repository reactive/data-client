---
name: interface-design
description: Interface design principles for package APIs — where configuration, behavior, and state belong across schemas, endpoints, hooks and Managers. Use when adding or changing options, behavior, or state in packages/*.
---
# Interface Design

[Resources](/rest/api/resource) are a collection of **methods** for a given **data model**. [Entities](/rest/api/Entity) and [Schemas](/rest/api/schema) declaratively define the data model. [Endpoints](/rest/api/Endpoint) are the methods on that data. Both should be as **declarative as possible** — describing *what*, not *how*.

The root `ARCHITECTURE.md` names the layers: data definition (schemas and endpoints), runtime in the view framework (hooks, composables), and runtime outside it (Managers). Each part changes for different reasons, is used in different contexts, and composes independently. Place new configuration or behavior in the part whose **reason to change** matches.

## Where an interface goes

| Layer | Part | Declares… | Changes when… | Examples |
|-------|------|-----------|---------------|----------|
| Data definition | **Schema** (Entity, Collection, Query) | Data model and relationships | Data shape or identity changes | `pk()`, `schema`, `merge()`, `process()`, `indexes` |
| Data definition | **Endpoint** (Endpoint, RestEndpoint, resource) | Methods on that data | API contract or cache policy changes | `path`, `method`, `schema`, `pollFrequency`, `getOptimisticResponse()` |
| Runtime in the view framework | **Hook / Composable** (useSuspense, useDLE, useQuery) | Data dependencies at point of use | UI interaction pattern changes | Suspense, `{ data, loading, error }`, subscription lifecycle |
| Runtime outside the view framework | **Manager** (NetworkManager, SubscriptionManager) | Side effects, and events from outside the app | An integration outside the store changes | `middleware`, `init()`, `cleanup()` |

## Placement Principles

**If it describes data identity or relationships** → Schema. Schemas are protocol-agnostic and UI-agnostic. An Entity's `pk()`, `merge()`, and nested `schema` work identically whether data arrives via REST, WebSocket, or `controller.set()`.

**If it describes how to obtain or mutate data** → Endpoint. Declare `path`, `method`, `schema`, and policy — not imperative fetch logic. Endpoints are UI-agnostic: the same endpoint powers React, Vue, SSR, or imperative `controller.fetch()`.

**If it describes how the user experiences data** → Hook. Loading states, error delivery, suspense, subscriptions, and reactivity adapters are UI concerns. Hooks co-locate data dependencies where data is rendered — not at the top of a tree. They are thin adapters over `Controller`, not duplicate cache logic.

**If it's shared policy** (expiry, staleness, optimistic updates) → `EndpointExtraOptions`. These live on endpoints as per-request policy, but are implemented by `Controller`/managers, not hooks.

**If it is a side effect, or reacts to something outside the app** → Manager. The reducer is pure, so network, timers, sockets and logging run in Manager `middleware`, and reach the store only by dispatching through `Controller`.

## Declarative Over Imperative

Favor declarative configuration that the framework interprets over imperative code users must write:

- **Schemas**: Declare `pk()`, `schema` relationships, `merge()` policy — the store handles normalization.
- **Endpoints**: Declare `path`, `method`, `schema`, `optimistic` — the framework handles fetching, caching, and updates.
- **Mutations**: `ctrl.fetch(TodoResource.partialUpdate, { id }, { completed })` — a single typed statement describing the action, not manual cache updates or invalidation cascades.

## What Stays the Same vs. What Varies

The `endpoint + args` input pattern is the **stable interface** shared by all hooks and `controller.fetch`. This enables one endpoint definition to power `useSuspense`, `useDLE`, `useCache`, `useSubscription`, or imperative `controller.fetch` — without the endpoint knowing which UI pattern consumes it.

When adding a new capability, ask:
- **Does every consumer need this?** → Endpoint or schema.
- **Do only some UI patterns need this?** → Hook or hook option.
- **Does it vary per call site?** → An argument, not a property.
- **Does it vary per endpoint definition?** → A property or `extend()` override.

## Anti-patterns

- Imperative update/invalidation logic where a declarative schema or `optimistic` flag suffices
- Encoding UI concerns (loading, error display) into endpoint or schema definitions
- Encoding transport details (URL construction, headers) into hooks or components
- Duplicating store/cache logic in hooks instead of going through `Controller`
- Adding hook-specific state to `Controller` — it serves all consumers (React, Vue, imperative)
- Prop-drilling fetched data instead of co-locating `useSuspense` where data is rendered
