---
title: Queryable schemas read data however it arrived
sidebar_label: Queryable
description: The store is a lookup table of Entities and Collections, so a page renders data that a list, a mutation or a websocket already delivered, without waiting for a fetch.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import TeamIssuesDemo from '../shared/\_TeamIssuesDemo.mdx';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';
import LookupTable from '@site/src/components/LookupTable';

# Queryable

The store is a lookup table. It holds each [Entity](/rest/api/Entity) once, by its primary key, and each
[Collection](/rest/api/Collection)'s list by its args, like `{ assigneeId: 1 }`. A schema is _Queryable_ when it can find
its data in that table from args alone.

So it doesn't matter how data arrived. A list, a detail response, a mutation's response, a websocket message and
[Controller.set()](../api/Controller.md#set) all write to the same table, and any read with matching args finds what
they wrote.

<SiteOnly>

<LookupTable />

</SiteOnly>

<AgentOnly>

| Data arrives from                                 | The table stores                                             | Reads that render it without a request                      | Requests sent |
| ------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- | ------------- |
| A mutation: `POST /issues` with `assigneeId: 1`   | Issue 6, added to the lists for `{ assigneeId: 1 }` and `{}` | `getList({ assigneeId: 1 })`, `getList()`, `get({ id: 6 })` | 1, not 4      |
| A list: `GET /issues?assigneeId=1`                | Issue 5, Issue 6 and the list for `{ assigneeId: 1 }`        | `get({ id: 5 })`, `get({ id: 6 })`                          | 1, not 3      |
| A websocket message: `{ id: 5, state: 'closed' }` | Issue 5's new fields                                         | Both lists and `get({ id: 5 })` show them                   | 0, not 3      |

The second count is what a cache keyed by request sends.

</AgentOnly>

One write serves every read it matches. When [getList.push](/rest/api/resource#push) creates an issue, its one `POST`
stores the issue and adds it to every stored list it belongs in. Those lists and the issue's detail page then render
it without a request.

A cache keyed by request can't do this. It stores each response apart. After the same `POST` it refetches the list on
screen, then fetches the other list and the detail as each one opens: four requests where the table needs one.

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
// Team loaded every user, each with their issues nested inside
const users = useSuspense(UserResource.getList);
// IssuePage finds Issue 5 by its id: no request
const issue = useSuspense(IssueResource.get, { id: 5 });
// UserPage finds one user's issues by their args: no request
const issues = useSuspense(IssueResource.getList, { assigneeId: 1 });
```

Where data sits in a response doesn't matter. Every Entity and Collection nested in it gets its own entry in the table,
so one response is the data of each page it covers ([Relational data](/rest/guides/relational-data)). The
[app below](#mutations) loads this way: only its first page sends a `GET`.

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
// That POST is the only request. The issue joined every stored list it
// matches, like getList({ assigneeId: 1 }) and getList(), and its detail
// page renders the response
navigate(`/issues/${issue.id}`);
```

The issue tracker below sends one `GET`, for its `Team` page. The user and issue pages read endpoints that never
fetched, and only mutations send requests.

<SiteOnly>

:::react

Open a person and add an issue: one `POST`. Go back, and `Team` already lists it. Open it, and its page renders from
that response. Change its assignee, then go home: it is in their list. No page waits. The preview's header shows 0
fetches in flight between mutations, and its Actions tab lists each request.

:::

</SiteOnly>

<TeamIssuesDemo />

- `/users` nests the issues assigned to each user in a Collection whose [nestKey](/rest/api/Collection#nestKey)
  returns `{ assigneeId }`, so `user.issues` and `IssueResource.getList({ assigneeId })` are one list.
- `NewIssue` creates with [getList.push](/rest/api/resource#push). That one request puts the issue in the user's list
  and on `Team`, and `IssuePage` renders it from the response.
- `IssuePage` changes the assignee with [getList.move](/rest/api/resource#move), so the issue leaves one user's list
  and joins the other's.

After each kind of mutation, these render without a fetch:

| Mutation                                                                                            | Renders next, without a fetch                                                                  |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Create: [getList.push](/rest/api/resource#push), [getList.unshift](/rest/api/resource#unshift)      | The new item's detail. Every stored list whose args match, and any [All](/rest/api/All) list   |
| Edit: [update](/rest/api/resource#update), [partialUpdate](/rest/api/resource#partialupdate)        | The item's detail with the new values, even when nothing fetched that detail                   |
| Edit that changes its list: [getList.move](/rest/api/resource#move)                                 | The list it left and the list it joined                                                        |
| Take out of a list: [getList.remove](/rest/api/RestEndpoint#remove)                                 | The lists without it. Its detail still renders                                                 |
| [delete](/rest/api/resource#delete)                                                                 | The lists without it. Its detail is [Invalid](./expiry-policy.md#expiry-status), so it fetches |
| No request, like a websocket [Manager](./managers.md): [Controller.set()](../api/Controller.md#set) | The detail of an Entity it wrote, and the list of a Collection it wrote                        |

A response can hold more than the item it changed. Every Entity in it is written the same way, so return what else
the mutation changed instead of refetching it ([Side effects](/rest/guides/side-effects)). An
[optimistic update](/rest/guides/optimistic-updates) makes the same writes before the response arrives.

### No data tearing {#tearing}

```ts
// A websocket Manager writes the message it was sent, when a teammate
// closes Issue 5: { id: 5, state: 'closed' }
controller.set(Issue, { id: message.id }, message);
// Team, the assignee's list, the open issue page and any page opened
// later all show it closed
```

Each view reads the one entry in the table, not a copy of the response that delivered it. So two views never show
different values for the same data, and no refetch is needed to bring a view up to date.

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

A [Query](/rest/api/Query) computes from any Queryable schema, and recomputes only when its inputs change. So a
[sorted list](/rest/api/Query#sorting) stays sorted after a push, and a [grouping](/rest/api/Query#groupby) or
[join](/rest/api/Query#object-schema-joins) follows every later write.
[useQuery()](../api/useQuery.md) reads the table and never fetches. [Controller.get()](../api/Controller.md#get) and
[Snapshot.get()](../api/Snapshot.md#get) read it the same way in [Managers](./managers.md), event handlers and
[getOptimisticResponse](/rest/api/RestEndpoint#getoptimisticresponse).

## Endpoints read the table before they fetch {#endpoints}

Every way of reading an endpoint uses the first of these that applies:

1. The endpoint has a response of its own. It reads that response, with that response's expiry.
2. The endpoint's schema is Queryable, and the table's result for its args is complete: no part of it is
   `undefined`. It reads that result.
3. Otherwise the data is missing, so the endpoint fetches.

This applies to [useSuspense()](../api/useSuspense.md), [useDLE()](../api/useDLE.md),
[useCache()](../api/useCache.md), [useLive()](../api/useLive.md), [useFetch()](../api/useFetch.md),
[Controller.getResponse()](../api/Controller.md#getResponse) and
[Controller.fetchIfStale()](../api/Controller.md#fetchIfStale). [Controller.fetch()](../api/Controller.md#fetch) always
requests.

### Stored data keeps its expiry {#expiry}

A complete result is treated like a response. It expires when the earliest-expiring Entity in it does, and the
[expiry policy](./expiry-policy.md) applies as usual:

- While the result is fresh, the endpoint makes no request.
- Once it is stale, it still renders, and the endpoint refetches.
- An [invalidIfStale](./expiry-policy.md#endpointinvalidifstale) endpoint treats a stale result as
  [Invalid](./expiry-policy.md#expiry-status), and an [invalidated](./expiry-policy.md#invalidate) endpoint treats any
  result that way, so they wait for a fetch.
- An Entity that fails [validate()](/rest/api/Entity#validate) counts as missing.

### Which results are complete {#complete}

- An Entity stored by any response is found by every endpoint whose schema holds that Entity and whose args produce its
  `pk`.
- Args `queryKey` doesn't read, like `expand` in `{ id, expand: 'comments' }`, don't affect the result.
- An object schema like `{ data: Issue }` is complete when every member is. An Array member never is. A Collection
  member is when the store holds it for those args. Two Entities must both be found by the same args.
- Until the endpoint's own response arrives, the result holds only what the schema declares. Plain values in it, like
  `total: 0`, are returned as written. Response fields it leaves out, like a `meta`, are `undefined`.

### Fields are not checked {#fields}

Finding an Entity doesn't check which fields it has. When list items lack fields the detail page shows, the detail
renders those fields' defaults, and doesn't fetch while the list data is fresh. To make it fetch, give the list a
summary Entity and make the detail Entity require the rest with [validate()](/rest/api/Entity#validate)
([Partial entities](/rest/guides/partial-entities)).

## How each schema finds its data {#query}

A Queryable schema has a [queryKey(args)](/rest/api/schema#queryable) method. It returns what a response would have
normalized to, and returns it only for data the table holds.

- An [Entity](/rest/api/Entity) returns its primary key. By default, args with the fields `pk()` reads, like `{ id }`,
  find it. `pk()`, [indexes](/rest/api/Entity#indexes) or `queryKey` itself change which args do
  ([Queryable by args](/rest/api/Entity#pk-args)).
- A [Collection](/rest/api/Collection) returns the list stored for its args. Endpoints that share a Collection read
  the same list: `/users/:assigneeId/issues` renders what `/issues?assigneeId=` loaded when both use
  `IssueResource.getList.schema`. A nested Collection takes its args from [nestKey](/rest/api/Collection#nestKey), and
  [argsKey](/rest/api/Collection#argsKey) leaves out args that don't filter the list, like `expand`.
- An object schema like `{ data: Issue }` combines its members' results.
- [All](/rest/api/All), [Union](/rest/api/Union), [Query](/rest/api/Query) and [Scalar](/rest/api/Scalar) are
  Queryable too ([what each returns](/rest/api/schema#queryable)).
- [Array](/rest/api/Array) and [Values](/rest/api/Values) are not. Use a Collection or All for a list that should be
  Queryable.

Mutations find lists by args too. `push` and `unshift` add to the lists that the request's args and body match, so
send the fields lists filter by, like `assigneeId`. `update` and `partialUpdate` change an item where it is; when an edit
changes which list holds the item, use `move`.

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
