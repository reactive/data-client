---
frameworks: [react]
title: Migrating server state from Redux to Reactive Data Client
sidebar_label: Redux Migration
---

import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# Migrating server state from Redux

Redux apps often keep server data in slices: maps of items by id, lists of ids, loading flags, and thunks that call
the API and dispatch the results. Every slice that holds a copy of an item needs a reducer to keep that copy current.
Reactive Data Client [normalizes](../concepts/normalization.md) every response into one store of
[Entities](/rest/api/Entity), so an item is updated in one place and every component that shows it re-renders.

The migration moves server data and the code around it (fetching, loading and error flags, freshness checks,
optimistic updates) to Data Client. Redux keeps client state: settings, drafts, UI state. This guide covers slices
written by hand or with `createEntityAdapter()`, thunks and `createAsyncThunk()`, `normalizr` schemas, and
[RTK Query](#rtk-query). [Steps](#steps) gives the order; [API map](#api-map) gives the replacement for each Redux API.

<SiteOnly>

## Migrate with your coding agent {#agent}

Paste this into your agent's chat:

```prompt
Migrate this app's server state from Redux to Reactive Data Client. Install the setup skill first: `npx skills add reactive/data-client --skill data-client-setup -y`, then read `.agents/skills/data-client-setup/SKILL.md` and follow it.
```

The setup skill follows this guide. Review its diff like a teammate's.

</SiteOnly>

<AgentOnly>

To migrate an app's server state from Redux, install the setup skill from the project root, then read
`.agents/skills/data-client-setup/SKILL.md` and follow it:

```bash
npx skills add reactive/data-client --skill data-client-setup -y
```

</AgentOnly>

## Steps {#steps}

Keep the app's tests passing after each step; they are the proof that behavior didn't change.

1. **Sort the state.** For each slice, mark what came from the server: item maps (`byId`, `entities`), id lists,
   `status` and `error` flags, fetch timestamps, page cursors, and maps that override fields of server items (like
   `votesById`). That moves. Everything else stays in Redux.
2. **Entities and endpoints.** Each item type in a map becomes an Entity. Each API call a thunk makes becomes an
   endpoint with a `schema`: follow the [REST setup](/rest) for HTTP calls, or wrap SDK client methods in an
   [Endpoint](/rest/api/Endpoint). Give an endpoint to every call that returns those items, including search,
   profiles, inboxes and mutation responses ([Data from every call](#every-call)). Put the Entities and endpoints in
   one folder every feature may import (such as `src/resources/`).
3. **Provider.** Add `DataProvider` at the root, outside the Redux `<Provider>` and every `<Suspense>` boundary.
   Keep the Redux store for client state.
4. **Reads.** Replace each `useEffect()` that dispatches a fetch, plus the `useSelector()` that reads its result,
   with `useSuspense()` in the component that renders the data ([Reads](#reads)).
5. **Mutations.** Replace thunks that call the API and then patch slices with `ctrl.fetch()` in the event handler.
   Move override maps onto the Entity, with `getOptimisticResponse()` for instant feedback
   ([Mutations](#mutations)).
6. **Thunks that stay.** Thunks that also change client state get the Controller from the store's thunk extra
   argument ([Thunks](#thunks)).
7. **Sign-out and account switches.** Where the app reset its server slices, call `ctrl.resetEntireStore()`
   ([Sign-out](#sign-out)).
8. **Tests.** Add `DataProvider` to test wrappers, and assert on what renders, not on slice state ([Tests](#tests)).
9. **Clean up.** Delete the moved slices, their selectors, thunks, entity adapters and `normalizr` schemas, and remove
   them from `combineReducers()` and any `redux-persist` config. Uninstall Redux only when no client state is left in
   it.

## API map {#api-map}

| Redux | Data Client |
| --- | --- |
| Item map (`byId`, `createEntityAdapter()`, `normalizr` `schema.Entity`) | An [Entity](/rest/api/Entity) class |
| A list of ids for a query, page cursors | The endpoint's `schema`: `[Post]`, or a [Collection](/rest/api/Collection) that new items join |
| `createAsyncThunk()` or a thunk that fetches | An endpoint with a `schema` |
| `useEffect(() => dispatch(fetchX(id)))` + `useSelector(selectX)` | `useSuspense(endpoint, args)` |
| `useSelector(selectXById(id))`, adapter `selectById()` / `selectAll()`, for items another request loaded | [useQuery(Entity, \{ id })](../api/useQuery.md): reads the store, never fetches |
| `status`, `loading`, `error` fields of a fetch | `<Suspense>` and an error boundary, or [useDLE()](../api/useDLE.md) |
| `status`, `error` of a mutation | [useLoading()](../api/useLoading.md): `const [run, isPending, error] = useLoading(fn, deps)` |
| Fetch timestamps, "skip if already loaded" checks | Delete them: endpoints refetch only when stale. Set [dataExpiryLength](../concepts/expiry-policy.md#endpointdataexpirylength); call `ctrl.fetchIfStale()` outside components |
| A reducer that copies items from another thunk's payload (`extraReducers`, `upsertMany()`) | Delete it: the other call's endpoint `schema` stores them |
| A reducer that patches an item after a mutation | Delete it, when the response is the updated item |
| Override maps applied in selectors (`votesById`, `savedById`) | Fields on the Entity, set by the mutation's response and [getOptimisticResponse()](/rest/guides/optimistic-updates) |
| `createSelector()` over items | Compute in render, or a [Query](/rest/api/Query) schema read with `useQuery()` |
| `getState().posts.byId[id]` in a thunk | `ctrl.get(Post, { id }, ctrl.getState())` |
| `upsertMany()` for items pushed by a socket or another SDK | [ctrl.set(\[Post\], rows)](../api/Controller.md#set-array), or a [Manager](../api/Manager.md) for streams |
| A reset action on sign-out or account switch | `ctrl.resetEntireStore()` |

## Data from every call {#every-call}

Redux apps copy items into the shared map wherever they arrive: a search thunk dispatches `postsReceived()`, a
profile reducer upserts the user's posts. In Data Client, every call that returns items gets an endpoint whose
`schema` names their Entities, and fetching it stores them.

```ts title="Before"
export const searchAll = createAsyncThunk(
  'search/all',
  async (q: string, { dispatch }) => {
    const { posts, users } = await client.search({ q });
    dispatch(postsReceived(posts));
    dispatch(usersReceived(users));
    return { postIds: posts.map(p => p.id), userIds: users.map(u => u.id) };
  },
);
```

```ts title="resources/entities.ts"
import { Entity } from '@data-client/endpoint';

export class User extends Entity {
  id = 0;
  name = '';

  static key = 'User';
}

export class Post extends Entity {
  id = 0;
  title = '';
  score = 0;
  myVote: -1 | 0 | 1 = 0;
  author = User.fromJS();

  static key = 'Post';
  static schema = { author: User };
}
```

```ts title="resources/search.ts"
import { Endpoint } from '@data-client/endpoint';
import { client } from '../client';
import { Post, User } from './entities';

export const search = new Endpoint(
  ({ q }: { q: string }) => client.search({ q }),
  { schema: { posts: [Post], users: [User] }, name: 'search' },
);
```

`useSuspense(search, { q })` returns `{ posts, users }` as Entity instances, and a later fetch of one post updates the
search results too. An Endpoint that wraps an inline function needs a `name`, because its key starts with it.

Items that arrive outside any request, like a socket message or a response the SDK hands to a callback, go in with
`ctrl.set([Post], posts)`. Don't make a placeholder endpoint just to store them with `ctrl.setResponse()`: give the
call its own endpoint, or use `set()`.

## Reads {#reads}

A component that dispatched a fetch on mount and selected the result calls `useSuspense()` instead. Loading and error
branches move to a `<Suspense>` fallback and an error boundary ([AsyncBoundary](../api/AsyncBoundary.md) is both).

```tsx title="Before, in PostPage" nocheck
const dispatch = useAppDispatch();
const post = useAppSelector(state => state.posts.byId[id]);
const status = useAppSelector(state => state.posts.status);
useEffect(() => {
  if (!post) dispatch(fetchPost(id));
}, [dispatch, id, post]);
if (status === 'loading' || !post) return <Spinner />;
return <PostView post={post} />;
```

```tsx title="After"
import { useSuspense } from '@data-client/react';
import { getPost } from './resources/posts';

export function PostPage({ id }: { id: number }) {
  const post = useSuspense(getPost, { id });
  return (
    <article>
      <h1>{post.title}</h1>
      <p>by {post.author.name}</p>
    </article>
  );
}
```

When a list loaded the post and its data is still fresh, `useSuspense(getPost, { id })` renders it without a fetch, as
long as `getPost`'s schema is the same Entity. Use `useQuery(Post, { id })` only where the item must come from the
store and never trigger a fetch.

## Mutations {#mutations}

Call `ctrl.fetch()` in the event handler where the app dispatched a mutation thunk. When the response is the changed
item, the reducer that patched it goes away. Map each item-patching reducer the way the
[TanStack Query guide](./tanstack-query-migration.md#mutations) maps each `invalidateQueries()` call: creates join
lists with a Collection's `push`, deletes use `schema.Invalidate`, and data the response lacks uses `ctrl.expireAll()`.

Slices that override fields of server items, like `votesById` or `readById` read back in selectors, become fields of
the Entity. The mutation's `getOptimisticResponse()` sets them right away, and Data Client rolls them back if the
request fails:

```ts title="resources/posts.ts"
import { Endpoint } from '@data-client/endpoint';
import { client } from '../client';
import { Post } from './entities';

export const getPost = new Endpoint(
  ({ id }: { id: number }) => client.getPost({ id }),
  { schema: Post, name: 'getPost' },
);

export const votePost = new Endpoint(
  ({ id, vote }: { id: number; vote: -1 | 0 | 1 }) =>
    client.votePost({ id, vote }),
  {
    schema: Post,
    sideEffect: true,
    name: 'votePost',
    getOptimisticResponse(snap, { id, vote }) {
      const post = snap.get(Post, { id });
      if (!post) throw snap.abort;
      return { ...post, myVote: vote, score: post.score - post.myVote + vote };
    },
  },
);
```

Delete the override slice and the selectors that merged it. `post.myVote` and `post.score` are right in every list
and detail view.

## Thunks that stay {#thunks}

Most server-data thunks become `ctrl.fetch()` calls in components. Keep a thunk only when it also changes client state.
Give it the Controller through the thunk middleware's extra argument, by creating the Redux store inside
`DataProvider`:

```ts title="store.ts"
import type { Controller } from '@data-client/react';
import { configureStore } from '@reduxjs/toolkit';
import { settings } from './settingsSlice';

export const makeStore = (ctrl: Controller) =>
  configureStore({
    reducer: { settings },
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: { ctrl } } }),
  });
```

```tsx title="AppProviders.tsx"
import { DataProvider, useController } from '@data-client/react';
import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './store';

function ReduxProvider({ children }: { children: ReactNode }) {
  const ctrl = useController();
  const [store] = useState(() => makeStore(ctrl));
  return <Provider store={store}>{children}</Provider>;
}

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <DataProvider>
    <ReduxProvider>{children}</ReduxProvider>
  </DataProvider>
);
```

A thunk then reads `extra.ctrl`: `createAsyncThunk('posts/hide', async (id, { extra }) => extra.ctrl.fetch(...))`.
Components that dispatch thunks into a store imported from a module can pass `ctrl` as a thunk argument instead.
Code outside React that needs the Controller, like socket, push or keyboard handlers, goes in a
[Manager](../api/Manager.md) (it gets the Controller in `middleware` and starts listening in `init()`), or in a
component's effect. Don't copy `useController()`
into a module variable from a component: it is unset until that component mounts, and tests that mount several
`DataProvider`s share it.

When the store and Controller must both exist at module level, [Redux integration](./redux.md)'s `prepareStore()`
creates them together, with Data Client's state inside the Redux store. Render `ExternalDataProvider` with them in
place of `DataProvider`.

Endpoint functions also run outside React, so they can't call the app's hooks. Give them the API client or token the
way the app's other non-React code gets it, such as a module that sign-in updates.

## Sign-out and account switches {#sign-out}

Where the app dispatched a reset of its server slices, call `ctrl.resetEntireStore()`. It clears every Entity and
response, and requests in flight never resolve into the store, so no other account's data stays on screen. Call it after the client or token
switches, so the refetches use the new account.

## Tests {#tests}

- Wrap test renders in `DataProvider`, with `<Suspense>` inside it, around the Redux `Provider` they already use. Each
  `DataProvider` mount starts with an empty store.
- Tests that dispatch a thunk and assert slice state go away; assert on what renders. Tests of the client-state slices
  stay.
- Mock servers (MSW, `nock`) and mocked SDK clients keep working. To render from fixtures without either, use
  [MockResolver](../api/MockResolver.md).

## RTK Query {#rtk-query}

RTK Query caches each endpoint and argument on its own and keeps them consistent with tags. Replace it like
[TanStack Query](./tanstack-query-migration.md), which caches the same way; this table maps its APIs.

| RTK Query | Data Client |
| --- | --- |
| `createApi()`, `fetchBaseQuery()` | A base `RestEndpoint` class ([REST setup](/rest)) |
| `builder.query()` | An endpoint with a `schema` |
| `useGetXQuery(arg)` | `useSuspense(endpoint, args)`, or `useDLE()` where the component renders its own spinner |
| `skip: true`, `skipToken` | `null` in place of the args |
| `builder.mutation()`, `useXMutation()` | `ctrl.fetch(endpoint, ...args)`, with `useLoading()` for pending state |
| `providesTags`, `invalidatesTags` | Delete them when the response is the changed Entity; see [Mutations](./tanstack-query-migration.md#mutations) for creates, deletes and counts |
| `onQueryStarted()` with `updateQueryData()` | `getOptimisticResponse()` on the endpoint |
| `util.updateQueryData()`, `util.upsertQueryData()` | `ctrl.set()` or `ctrl.setResponse()` |
| `transformResponse` | The endpoint's `schema`, or [Entity.process()](/rest/api/Entity#process) |
| `keepUnusedDataFor` | `DataProvider`'s [gcPolicy](../api/DataProvider.md#gcPolicy) |
| `pollingInterval` | `pollFrequency` on the endpoint, read with [useLive()](../api/useLive.md) |
| `refetchOnMountOrArgChange` | `dataExpiryLength` on the endpoint |
| `refetchOnFocus`, `refetchOnReconnect` | Delete them |
| `usePrefetch()`, `util.prefetch()` | `ctrl.fetchIfStale(endpoint, args)` |
| `endpoints.x.initiate()` in thunks or loaders | `ctrl.fetch(endpoint, args)`, or `ctrl.fetchIfStale()` |
| `util.resetApiState()` | `ctrl.resetEntireStore()` |
| `api.reducer`, `api.middleware` | Remove them from `configureStore()` |

## Check the migration {#check}

- No slice holds server items, fetch status or fetch timestamps; no selector merges an override map into an item.
- Every endpoint that returns Entities has a `schema`, including search, profile and mutation endpoints.
- No component dispatches a fetch in `useEffect()`.
- No module variable holds a Controller, and no endpoint exists only to be filled with `ctrl.setResponse()`.
- Sign-out and account switches call `ctrl.resetEntireStore()`.
- The type checker, unit tests and end-to-end tests pass.
- After a mutation, every page showing that item shows the change without a reload.
