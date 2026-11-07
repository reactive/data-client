---
frameworks: [react]
title: Migrating from TanStack Query to Reactive Data Client
sidebar_label: TanStack Query Migration
---

import SiteOnly from '@site/src/components/SiteOnly';

# Migrating from TanStack Query

TanStack Query (React Query) caches each query key's response on its own, so the app keeps them consistent by
invalidating keys after every mutation. Reactive Data Client [normalizes](../concepts/normalization.md) responses
into [Entities](/rest/api/Entity): a mutation's response updates every list and detail that shows that entity, and
most invalidation code goes away.

The migration replaces query functions and keys with typed endpoints, hooks with [useSuspense()](../api/useSuspense.md)
and [Controller](../api/Controller.md) calls, and the `QueryClient` with [DataProvider](../api/DataProvider.md).
[Steps](#steps) gives the order; [API map](#api-map) gives the replacement for each TanStack Query API.

<SiteOnly>

## Migrate with your coding agent {#agent}

Paste this into your agent's chat:

```prompt
Migrate this app from TanStack Query to Reactive Data Client. Install the setup skill first: `npx skills add reactive/data-client --skill data-client-setup -y`, then read `.agents/skills/data-client-setup/SKILL.md` and follow it.
```

The setup skill follows this guide. Review its diff like a teammate's.

</SiteOnly>

## Steps {#steps}

Keep the app's tests passing after each step; they are the proof that behavior didn't change.

1. **Endpoints and schemas.** Turn each query and mutation function into an endpoint: follow the
   [REST setup](/rest) for the HTTP library the functions call (axios, fetch, ky), then give each endpoint a
   `schema` built from [Entities](/rest/api/Entity). Without a schema nothing is normalized, and you will need to keep
   every `invalidateQueries` call.
2. **Provider.** Replace `QueryClientProvider` with `DataProvider` ([Provider](#provider)).
3. **Reads.** Replace `useQuery()` and `useSuspenseQuery()` with `useSuspense()` in the component that renders the
   data ([Reads](#reads)).
4. **Mutations.** Replace `useMutation()` with `ctrl.fetch()`, and delete the invalidation that normalization makes
   unneeded ([Mutations](#mutations)).
5. **Loaders and prefetching.** Replace `queryClient` in router loaders and hover prefetching with
   `ctrl.fetchIfStale()` ([Loaders and prefetching](#loaders)).
6. **Infinite queries.** Replace `useInfiniteQuery()` with a [Collection](/rest/api/Collection) and `getPage`
   ([Infinite queries](#infinite)).
7. **Auth.** Replace auth libraries built on TanStack Query, like `react-query-auth` ([Auth](#auth)).
8. **Tests.** Replace `QueryClientProvider` in test wrappers, and loading-spinner assumptions ([Tests](#tests)).
9. **Clean up.** Delete query key factories, `queryOptions()` helpers and `lib/react-query.ts`-style config. Uninstall
   `@tanstack/react-query` and `@tanstack/react-query-devtools` when no file imports them.

## API map {#api-map}

| TanStack Query | Data Client |
| --- | --- |
| `queryFn` + `queryKey`, `queryOptions()` | An endpoint with a `schema`. The endpoint and its args are the key, so key factories go away |
| `useQuery()`, `useSuspenseQuery()` | `useSuspense(endpoint, args)`: loading goes to the nearest `<Suspense>`, errors to the nearest error boundary, and `data` is never `undefined` |
| `useQuery()` where the component renders its own spinner or error | [useDLE()](../api/useDLE.md): `{ data, loading, error }` |
| `enabled: false` | `null` in place of the args: `useSuspense(endpoint, id ? { id } : null)` returns `undefined` and fetches nothing |
| `select` | Compute in render, or a [Query](/rest/api/Query) schema read with [useQuery()](../api/useQuery.md) |
| `useQueries()` | [useFetch()](../api/useFetch.md) for each, then React's `use()`: they fetch in parallel |
| `staleTime` | [dataExpiryLength](../concepts/expiry-policy.md#endpointdataexpirylength) on the endpoint or base class. The default is 60 seconds (TanStack Query's is 0) |
| `gcTime` | `DataProvider`'s [gcPolicy](../api/DataProvider.md#gcPolicy) |
| `retry: false` | `errorExpiryLength = Infinity` on the base class. Data Client has no retry loop: an errored request is fetched again only when a component needs it after `errorExpiryLength` (default 1 second) |
| `refetchInterval` | `pollFrequency` on the endpoint, read with [useLive()](../api/useLive.md) |
| `refetchOnWindowFocus` | Delete it: Data Client doesn't refetch on window focus |
| `placeholderData: keepPreviousData` | Change the args inside `startTransition()` (or [useDebounce()](../api/useDebounce.md) for typed input): React keeps showing the current data while the next loads |
| `initialData` from a list query | Delete it: an Entity the list loaded renders on the detail page without a fetch, when the detail endpoint's schema is that Entity |
| `useMutation()` | `ctrl.fetch(endpoint, ...args)` in the event handler, from [useController()](../api/useController.md) |
| `isPending`, `error` of a mutation | [useLoading()](../api/useLoading.md): `const [run, isPending, error] = useLoading(fn, deps)` |
| `isSuccess`, `onSuccess`, `onError` | Code after or around `await ctrl.fetch()` ([Mutations](#mutations)) |
| `invalidateQueries()` after an update | Delete it, when the response is the updated Entity |
| `invalidateQueries()` after a create | `ctrl.fetch(Resource.getList.push, body)` (or `unshift`): the new Entity joins every matching list. Lists split into numbered pages: `ctrl.expireAll(Resource.getList)` |
| `invalidateQueries()` after a delete | Delete it: `resource().delete` (or a `schema.Invalidate` schema) removes the Entity from every list |
| `invalidateQueries()` for data the response doesn't include (counts, totals) | `ctrl.expireAll(endpoint)`: mounted components refetch |
| `refetchQueries()` | `ctrl.fetch(endpoint, args)` |
| `setQueryData()` | `ctrl.setResponse(endpoint, args, response)`; for Entities, `ctrl.set(Entity, args, value)` |
| `getQueryData()` | In a component, [useCache()](../api/useCache.md). Elsewhere, `ctrl.get(schema, args, ctrl.getState())` |
| `prefetchQuery()`, `ensureQueryData()`, `getQueryData() ?? fetchQuery()` | `ctrl.fetchIfStale(endpoint, args)` |
| `fetchQuery()` | `ctrl.fetch(endpoint, args)` |
| `onMutate` optimistic update and rollback | [getOptimisticResponse()](/rest/guides/optimistic-updates) on the endpoint: Data Client rolls back on error |
| `useInfiniteQuery()` | A [Collection](/rest/api/Collection) and `ctrl.fetch(endpoint.getPage, args)` ([Infinite queries](#infinite)) |
| `queryClient.clear()`, `removeQueries()` on logout | `ctrl.resetEntireStore()` |
| `QueryClientProvider`, `new QueryClient()` | `DataProvider` |
| `useQueryClient()` | `useController()` |
| `ReactQueryDevtools` | Delete it: `DataProvider` adds [devtools](../getting-started/debugging.md) in development |
| `HydrationBoundary`, `dehydrate()` | [Server Side Rendering](./ssr.md) |

:::warning

Data Client's own [useQuery()](../api/useQuery.md) is not TanStack Query's. It reads a schema from the store and never
fetches. Replace TanStack Query's `useQuery()` with `useSuspense()` or `useDLE()`.

:::

## Provider {#provider}

Put `DataProvider` where `QueryClientProvider` was, and the app's `<Suspense>` boundary inside it.
`useSuspense()` suspends to the nearest boundary *below* `DataProvider`: a boundary above it never catches.

```tsx title="provider.tsx"
import { DataProvider } from '@data-client/react';
import { Suspense, type ReactNode } from 'react';

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider>
    <Suspense fallback={<Loading />}>{children}</Suspense>
  </DataProvider>
);
```

`DataProvider` makes its own store, so there is no client to create. Move `QueryClient` `defaultOptions` to the base
endpoint class: `staleTime` becomes `dataExpiryLength`, and `retry: false` becomes `errorExpiryLength = Infinity`.
Delete `refetchOnWindowFocus`.

## Reads {#reads}

Call `useSuspense()` in the component that renders the data, and delete the per-feature `useDiscussions()` hook that
wrapped `useQuery()`. Two components that ask for the same endpoint and args share one fetch and one store entry, so
nothing is gained by sharing a hook, and a hook hides what the component depends on.

```ts title="Before"
export const getDiscussionsQueryOptions = ({ page }: { page?: number } = {}) =>
  queryOptions({
    queryKey: page ? ['discussions', { page }] : ['discussions'],
    queryFn: () => getDiscussions(page),
  });

export const useDiscussions = ({ page }: { page?: number }) =>
  useQuery(getDiscussionsQueryOptions({ page }));
```

```tsx title="Before, in DiscussionsList" nocheck
const discussionsQuery = useDiscussions({ page });
if (discussionsQuery.isLoading) return <Spinner />;
const discussions = discussionsQuery.data?.data;
if (!discussions) return null;
```

```tsx title="After"
import { useSuspense } from '@data-client/react';
import { DiscussionResource } from './resources/Discussion';

export function DiscussionsList({ page }: { page: number }) {
  const { data: discussions, meta } = useSuspense(DiscussionResource.getList, {
    page,
  });
  return (
    <ul>
      {discussions.map(discussion => (
        <li key={discussion.id}>{discussion.title}</li>
      ))}
    </ul>
  );
}
```

The `isLoading` branch moves to a `<Suspense>` fallback (or an [AsyncBoundary](../api/AsyncBoundary.md), which also
catches errors) around the component, and the `!data` guard goes away. Keep the app's own spinner as the fallback.

Two `useSuspense()` calls in one component load one after the other. When neither needs the other's data, start both
with `useFetch()` and read them with `use()`.

### Envelope responses

When the API wraps responses, like `{ "data": [...], "meta": {...} }`, describe the envelope in the schema instead of
unwrapping it, so components keep reading `meta`:

```ts title="resources/Discussion.ts"
import { Entity, resource } from '@data-client/rest';

export class Discussion extends Entity {
  id = '';
  title = '';
  body = '';

  static key = 'Discussion';
}

interface Meta {
  page: number;
  total: number;
  totalPages: number;
}

export const DiscussionResource = resource({
  path: '/discussions/:id',
  searchParams: {} as { page?: number },
  schema: Discussion,
}).extend(Base => ({
  get: Base.get.extend({ schema: { data: Discussion } }),
  getList: Base.getList.extend({
    schema: { data: [Discussion], meta: {} as Meta },
  }),
  // a plain POST: a new item shifts every numbered page, so callers expire the list
  create: Base.getList.push.extend({ schema: Discussion }),
}));
```

The extra `getList` arguments and `schema` replace the envelope's types; `create` is explained in
[Mutations](#mutations).

## Mutations {#mutations}

Call `ctrl.fetch()` where the app called `mutate()`. What `onSuccess` did goes after the `await`; `onError` goes in
a `catch`. Track pending and error state with `useLoading()`.

```ts title="Before"
export const useUpdateDiscussion = ({ mutationConfig }: Options = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.refetchQueries({
        queryKey: getDiscussionQueryOptions(data.id).queryKey,
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: updateDiscussion,
  });
};
```

```tsx title="After"
import { useController, useLoading } from '@data-client/react';
import { DiscussionForm } from './DiscussionForm';
import { DiscussionResource } from './resources/Discussion';

export function UpdateDiscussion({ id }: { id: string }) {
  const ctrl = useController();
  const [update, isPending, error] = useLoading(
    async (data: { title: string; body: string }) => {
      await ctrl.fetch(DiscussionResource.partialUpdate, { id }, data);
      toast('Discussion Updated');
    },
    [ctrl, id],
  );
  return (
    <DiscussionForm onSubmit={update} disabled={isPending} error={error} />
  );
}
```

The `refetchQueries()` call is gone: the response is the updated `Discussion`, so the list and the detail page both
show the new title. TanStack Query apps usually invalidate the detail key but not every list key, so lists show
stale data until they expire; after the migration they don't.

Decide what to do with each `invalidateQueries()` and `refetchQueries()` call from the response:

- **Response is the changed Entity** (update, partial update): delete the call.
- **Create**: fetch the list's `push` (or `unshift`) endpoint instead of the plain `POST`. For lists split into
  numbered pages, where a new item shifts every page, add a plain `POST` endpoint (`create` in the
  [envelope example](#envelope-responses): `Base.getList.push.extend({ schema: Discussion })`), then call
  `ctrl.expireAll(Resource.getList)`.
- **Delete**: `resource().delete` removes the Entity from every list. For a custom endpoint, use
  `schema: new schema.Invalidate(MyEntity)`.
- **Data the response doesn't include** (a count, another resource's totals): `ctrl.expireAll(endpoint)`, or return
  it in the response ([side effects](/rest/guides/side-effects)).

### Success state

`useLoading()` has no `isSuccess`. When a form or dialog closes on success, close it after the `await`, or keep a
flag:

```ts title="useMutate.ts"
import { useLoading } from '@data-client/react';
import { useState } from 'react';

export function useMutate<A extends unknown[]>(
  mutate: (...args: A) => Promise<unknown>,
  deps: readonly unknown[],
) {
  const [isDone, setIsDone] = useState(false);
  const [run, isPending, error] = useLoading(async (...args: A) => {
    setIsDone(false);
    await mutate(...args);
    setIsDone(true);
  }, deps);
  return { run, isPending, error, isDone };
}
```

## Loaders and prefetching {#loaders}

Router loaders that receive the `queryClient` receive the Controller instead. `useController()` returns the same
Controller on every render, so it is safe to create the router from it.

```ts title="Before"
export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const query = getDiscussionQueryOptions(params.discussionId as string);
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };
```

```ts title="After"
import type { Controller } from '@data-client/react';
import { DiscussionResource } from './resources/Discussion';

export const clientLoader =
  (ctrl: Controller) =>
  async ({ params }: { params: { discussionId?: string } }) =>
    ctrl.fetchIfStale(DiscussionResource.get, {
      id: params.discussionId as string,
    });
```

`fetchIfStale()` fetches only when the data is missing or stale, which is what `getQueryData() ?? fetchQuery()`,
`ensureQueryData()` and `prefetchQuery()` do. Use it for hover prefetching too:
`onMouseEnter={() => ctrl.fetchIfStale(DiscussionResource.get, { id })}`. Load several endpoints with
`Promise.all()` of `fetchIfStale()` calls.

## Infinite queries {#infinite}

`useInfiniteQuery()` keeps an array of pages. Data Client keeps one list: a [Collection](/rest/api/Collection) that each
new page appends to. Set `paginationField` on the endpoint to get its `getPage` endpoint.

```ts title="resources/Comment.ts"
import { Collection, Entity, RestEndpoint } from '@data-client/rest';

export class Comment extends Entity {
  id = '';
  body = '';
  discussionId = '';

  static key = 'Comment';
}

interface Meta {
  page: number;
  totalPages: number;
}

// every page of one discussion's comments shares one list
const discussionComments = new Collection([Comment], {
  argsKey: ({ discussionId }: { discussionId: string }) => ({ discussionId }),
});

export const getComments = new RestEndpoint({
  path: '/comments',
  searchParams: {} as { discussionId: string; page?: number },
  schema: { data: discussionComments, meta: {} as Meta },
  paginationField: 'page',
});

export const createComment = new RestEndpoint({
  path: '/comments',
  method: 'POST',
  searchParams: {} as { discussionId: string },
  body: {} as { body: string },
  schema: discussionComments.push,
});
```

`argsKey` leaves out `page`, so every page and the `push` endpoint find the same list. A new comment appears without
invalidating anything.

```tsx title="CommentsList.tsx"
import { useController, useLoading, useSuspense } from '@data-client/react';
import { getComments } from './resources/Comment';

export function CommentsList({ discussionId }: { discussionId: string }) {
  const { data: comments, meta } = useSuspense(getComments, { discussionId });
  const ctrl = useController();
  const [loadMore, isLoadingMore] = useLoading(
    () =>
      ctrl.fetch(getComments.getPage, { discussionId, page: meta.page + 1 }),
    [ctrl, discussionId, meta.page],
  );
  return (
    <>
      <ul>
        {comments.map(comment => (
          <li key={comment.id}>{comment.body}</li>
        ))}
      </ul>
      {meta.page < meta.totalPages && (
        <button onClick={loadMore} disabled={isLoadingMore}>
          Load more
        </button>
      )}
    </>
  );
}
```

`pages.flatMap()` goes away, `hasNextPage` comes from the response (`meta` here, or a cursor), and
`isFetchingNextPage` is `useLoading()`'s pending flag. For cursor APIs, see [pagination](/rest/guides/pagination).

## Auth {#auth}

Libraries like `react-query-auth` give `useUser()`, `useLogin()`, `useLogout()` and `AuthLoader` on top of TanStack
Query. Rebuild them from endpoints:

```ts title="auth.ts"
import { useController, useLoading, useSuspense } from '@data-client/react';
import { Entity, RestEndpoint } from '@data-client/rest';

class User extends Entity {
  id = '';
  email = '';

  static key = 'User';
}

const getMe = new RestEndpoint({ path: '/auth/me', schema: { data: User } });
const login = new RestEndpoint({
  path: '/auth/login',
  method: 'POST',
  body: {} as { email: string; password: string },
  schema: { user: User },
});
const logout = new RestEndpoint({ path: '/auth/logout', method: 'POST' });

export const useUser = () => useSuspense(getMe).data;

export const useLogin = (onSuccess?: () => void) => {
  const ctrl = useController();
  return useLoading(
    async (body: { email: string; password: string }) => {
      const { user } = await ctrl.fetch(login, body);
      // the signed-in user becomes the current one without refetching
      await ctrl.setResponse(getMe, { data: user });
      onSuccess?.();
    },
    [ctrl, onSuccess],
  );
};

export const useLogout = (onSuccess?: () => void) => {
  const ctrl = useController();
  return useLoading(async () => {
    await ctrl.fetch(logout);
    await ctrl.resetEntireStore();
    onSuccess?.();
  }, [ctrl, onSuccess]);
};
```

`useRegister()` is `useLogin()` with the register endpoint and its body type. `AuthLoader` goes away: `useUser()` suspends to the app's `<Suspense>` boundary until the user loads. These hooks wrap
actions, not a data binding, so they are worth keeping as hooks. `useUser()` returns the user itself where
`react-query-auth` returned a query, so `user.data` becomes `user`. To sign out on any 401 response, add
[LogoutManager](../api/LogoutManager.md); for token storage, see [authentication](/rest/guides/auth).

## Tests {#tests}

- Replace `QueryClientProvider` (and the per-test `new QueryClient()`) in test wrappers with `DataProvider`, with
  `<Suspense>` inside it. Each `DataProvider` mount starts with an empty store.
- Helpers that wait for a spinner to disappear fail when the data is already in the store, because then nothing
  suspends. Wait only when a spinner is present:

  ```ts title="test-utils.ts"
  import { screen, waitForElementToBeRemoved } from '@testing-library/react';

  const loadingElements = () => screen.queryAllByTestId(/loading/i);

  export const waitForLoadingToFinish = async () => {
    if (loadingElements().length)
      await waitForElementToBeRemoved(loadingElements);
  };
  ```

- Mock servers (MSW, `nock`) keep working unchanged. To render from fixtures without a server, use
  [MockResolver](../api/MockResolver.md).
- Assertions on query keys or `queryClient` state go away; assert on what renders.

## Check the migration {#check}

- No file imports `@tanstack/react-query`, and no `queryKey`, `queryOptions` or `useQueryClient` remains.
- Every endpoint that returns Entities has a `schema`.
- Each `<Suspense>` or `AsyncBoundary` that catches a `useSuspense()` is inside `DataProvider`.
- The type checker, unit tests and end-to-end tests pass.
- After a mutation, every page showing that Entity shows the change without a reload. A test that edits an item on
  its detail page, then goes back to the list, proves it.
