---
title: Queryable schemas read data however it arrived
sidebar_label: Queryable
description: The store is a lookup table of Entities and Collections, so a page renders data that a list, a mutation or a websocket already delivered, without waiting for a fetch.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import IssueListDetailDemo from '../shared/\_IssueListDetailDemo.mdx';
import TeamIssuesDemo from '../shared/\_TeamIssuesDemo.mdx';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';
import LookupTable from '@site/src/components/LookupTable';

# Queryable

The store is a lookup table. It holds each [Entity](/rest/api/Entity) once, by its primary key, and each
[Collection](/rest/api/Collection)'s list by its args, like `{ assigneeId: 1 }`. A schema is _Queryable_ when it can find
its data in that table from args alone. Every write goes to that one table, whatever delivered it: a list, a detail
response, a mutation's response, a websocket message or any other code calling
[Controller.set()](../api/Controller.md#set).

<SiteOnly>

<LookupTable />

</SiteOnly>

<AgentOnly>

| Data arrives from                                 | The table stores                                             | Reads that render it without a request                      | Requests sent |
| ------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- | ------------- |
| A mutation: `POST /issues` with `assigneeId: 1`   | Issue 6, added to the lists for `{ assigneeId: 1 }` and `{}` | `getList({ assigneeId: 1 })`, `getList()`, `get({ id: 6 })` | 1, not 4      |
| A list: `GET /issues?assigneeId=1`                | Issue 5, Issue 6 and the list for `{ assigneeId: 1 }`        | `get({ id: 5 })`, `get({ id: 6 })`                          | 1, not 3      |
| A websocket message: `{ id: 5, state: 'closed' }` | Issue 5's new fields                                         | Both lists and `get({ id: 5 })` show them                   | 0, not 3      |

</AgentOnly>

One write serves every read it matches. When [getList.push](/rest/api/resource#push) creates an issue, its one `POST`
adds the issue to every stored list it belongs in, and is the issue's detail. A cache keyed by request stores each
response apart, so after the same `POST` it refetches the list on screen, then fetches the other list and the detail as
each one opens: four requests where the table needs one.

## Benefits {#benefits}

- [No overfetching on navigation](#navigation): a page renders data another page already loaded, wherever it sat in
  that page's response.
- [Faster mutations](#mutations): a mutation's response updates every list it belongs in, and is the next page's
  data.
- [No data tearing](#tearing): two views never show different values for the same data, whichever transport changed
  it.
- [Derived views without requests](#derived): counts, filters, sorts and joins compute from data already loaded.

### No overfetching on navigation {#navigation}

```ts
// IssueList loaded every issue
const issues = useSuspense(IssueResource.getList);
// IssueDetail, opened from that list, finds Issue 5 by its id: no request
const issue = useSuspense(IssueResource.get, { id: 5 });
```

Open an issue below. `IssueDetail` renders without a loading state, because the list already stored that `Issue`.

<IssueListDetailDemo defaultTab="IssueDetail" />

Every Entity and Collection nested in a response gets its own entry, so one response is the data of every page it
covers ([Relational data](/rest/guides/relational-data)). In the [issue tracker below](#mutations), `/users` nests each
user's issues, and that one response is the data of every user and issue page.

:::react

In the [React benchmarks](./performance.md), with a simulated 40 ms network delay, switching between a list and its
items is 21× faster than TanStack Query, which keys the detail query separately and fetches it.

:::

### Faster mutations {#mutations}

```ts
const issue = await ctrl.fetch(IssueResource.getList.push, {
  assigneeId: 1,
  title: 'Fix signup redirect',
});
// That POST is the only request: the issue is already in getList({ assigneeId: 1 })
// and getList(), and is its detail page's data
navigate(`/issues/${issue.id}`);
```

The issue tracker below sends one `GET`, for its `Team` page. Every other page reads data that response or a mutation
wrote, so only mutations send requests.

<SiteOnly>

:::react

Open a person and add an issue: one `POST`. Go back, and `Team` already lists it. Open it, and its page renders from
that response. Change its assignee, then go home: it is in their list. No page waits. The preview's header shows 0
fetches in flight between mutations, and its Actions tab lists each request.

:::

</SiteOnly>

<TeamIssuesDemo />

- `/users` nests each user's issues in a Collection whose [nestKey](/rest/api/Collection#nestKey) returns
  `{ assigneeId }`, so `user.issues` and `IssueResource.getList({ assigneeId })` are one list.
- `NewIssue` creates with [getList.push](/rest/api/resource#push), and `IssuePage` reassigns with
  [getList.move](/rest/api/resource#move), which takes the issue out of one user's list and into the other's.

After each kind of mutation, these render without a fetch:

| Mutation                                                                                            | Renders next, without a fetch                                                                  |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Create: [getList.push](/rest/api/resource#push), [getList.unshift](/rest/api/resource#unshift)      | The new item's detail. Every stored list whose args match, and any [All](/rest/api/All) list   |
| Edit: [update](/rest/api/resource#update), [partialUpdate](/rest/api/resource#partialupdate)        | The item's detail with the new values, even when nothing fetched that detail                   |
| Edit that changes its list: [getList.move](/rest/api/resource#move)                                 | The list it left and the list it joined                                                        |
| Take out of a list: [getList.remove](/rest/api/RestEndpoint#remove)                                 | The lists without it. Its detail still renders                                                 |
| [delete](/rest/api/resource#delete)                                                                 | The lists without it. Its detail is [Invalid](./expiry-policy.md#expiry-status), so it fetches |
| No request, like a websocket [Manager](./managers.md): [Controller.set()](../api/Controller.md#set) | The detail of an Entity it wrote, and the list of a Collection it wrote                        |

Writes find lists by args, like reads. `push` and `unshift` add to the lists that the request's args and body match, so
send the fields lists filter by, like `assigneeId`. `update` and `partialUpdate` change an item where it is, so when an
edit changes which list holds the item, use `move`.

Every Entity in a response is written the same way, so a mutation can return what else it changed instead of
refetching it ([Side effects](/rest/guides/side-effects)), and an [optimistic update](/rest/guides/optimistic-updates)
makes the same writes before the response arrives.

### No data tearing {#tearing}

```ts
// A websocket Manager writes the message it was sent, when a teammate
// closes Issue 5: { id: 5, state: 'closed' }
controller.set(Issue, { id: message.id }, message);
// Team, the assignee's list, the open issue page and any page opened
// later all show it closed
```

Each view reads the one entry in the table, not a copy of the response that delivered it, so views never disagree and
none needs a refetch to catch up.

### Derived views without requests {#derived}

```ts
const openCount = new Query(
  IssueResource.getList.schema,
  issues => issues.filter(issue => issue.state === 'open').length,
);
// A badge counts a list other pages loaded: no request
const count = useQuery(openCount, { assigneeId: 1 });
// An Entity reads the same way, like the issue's assignee
const assignee = useQuery(User, { id: issue.assigneeId });
```

A [Query](/rest/api/Query) computes from any Queryable schema and recomputes when its inputs change, so a
[sort](/rest/api/Query#sorting), [grouping](/rest/api/Query#groupby) or [join](/rest/api/Query#object-schema-joins)
follows every later write. [useQuery()](../api/useQuery.md) reads the table and never fetches;
[Controller.get()](../api/Controller.md#get) and [Snapshot.get()](../api/Snapshot.md#get) read it the same way in
[Managers](./managers.md), event handlers and [getOptimisticResponse](/rest/api/RestEndpoint#getoptimisticresponse).

## Endpoints read the table before they fetch {#endpoints}

An endpoint read uses its own response, with that response's expiry, when it has one. Otherwise, if its schema is
Queryable and the table's result for its args is complete, it uses that result as if it were a response. Otherwise the data is missing.
[useSuspense()](../api/useSuspense.md), [useDLE()](../api/useDLE.md), [useLive()](../api/useLive.md),
[useFetch()](../api/useFetch.md) and [Controller.fetchIfStale()](../api/Controller.md#fetchIfStale) fetch missing or
stale data. [useCache()](../api/useCache.md) and [Controller.getResponse()](../api/Controller.md#getResponse) never
fetch, so missing data stays `undefined`. [Controller.fetch()](../api/Controller.md#fetch) always requests.

### Stored data keeps its expiry {#expiry}

A result from the table expires when its earliest-expiring Entity does, and the [expiry policy](./expiry-policy.md)
applies as to any response: fresh data makes no request, and stale data still renders while the APIs that fetch
refetch it. Data that is [Invalid](./expiry-policy.md#expiry-status) waits for a fetch: a stale result for an
[invalidIfStale](./expiry-policy.md#endpointinvalidifstale) endpoint, and any result for an
[invalidated](./expiry-policy.md#invalidate) one. An Entity that fails [validate()](/rest/api/Entity#validate) counts
as missing.

### Fields are not checked {#fields}

Finding an Entity doesn't check which fields it has. When list items lack fields the detail page shows, the detail
renders those fields' defaults, and doesn't fetch while the list data is fresh. To make it fetch, give the list a
summary Entity and make the detail Entity require the rest with [validate()](/rest/api/Entity#validate)
([Partial entities](/rest/guides/partial-entities)).

## How each schema finds its data {#query}

A Queryable schema's [queryKey(args)](/rest/api/schema#queryable) returns what a response would have normalized to,
only for data the table holds, and reads nothing else: args it ignores, like `expand` in `{ id, expand: 'comments' }`,
don't change the result. A result is complete when no part of it is `undefined`.

- An [Entity](/rest/api/Entity) returns its primary key, so any endpoint whose schema holds it and whose args produce
  that key finds it, whichever response stored it. By default those are the fields `pk()` reads, like `{ id }`;
  `pk()`, [indexes](/rest/api/Entity#indexes) or `queryKey` itself change that
  ([Queryable by args](/rest/api/Entity#pk-args)).
- A [Collection](/rest/api/Collection) returns the list stored for its args, so endpoints sharing one read the same
  list: `/users/:assigneeId/issues` renders what `/issues?assigneeId=` loaded when both use
  `IssueResource.getList.schema`. A nested Collection takes its args from [nestKey](/rest/api/Collection#nestKey), and
  [argsKey](/rest/api/Collection#argsKey) leaves out args that don't filter the list, like `expand`.
- An object schema like `{ data: Issue }` is complete when every member is, so two Entity members must both be found by
  the same args. Plain values it declares, like `total: 0`, are returned as written, and response fields it leaves out,
  like a `meta`, are `undefined` until the endpoint's own response arrives.
- [All](/rest/api/All), [Union](/rest/api/Union), [Query](/rest/api/Query) and [Scalar](/rest/api/Scalar) are
  Queryable too ([what each returns](/rest/api/schema#queryable)). [Array](/rest/api/Array) and
  [Values](/rest/api/Values) are not, so a schema with one never finds a complete result; use a Collection or All for a
  list that should be Queryable.

## Next steps

- [Lists to details](../getting-started/data-dependency.md#list-detail) - a list and detail page sharing data, and what
  to do when list items have fewer fields
- [Relational data](/rest/guides/relational-data) - nested Entities and Collections, client-side joins and reverse
  lookups
- [Expiry Policy](./expiry-policy.md) - when stored data is fresh, stale or invalid, and how to change that
- [Queryable by args](/rest/api/Entity#pk-args) - which args find an Entity, and how to change that
- [Collection](/rest/api/Collection) - which args find a list, and the mutations that add to, move between and remove
  from lists
- [Queryable schemas](/rest/api/schema#queryable) - what each schema's `queryKey` returns, and every API that uses it
