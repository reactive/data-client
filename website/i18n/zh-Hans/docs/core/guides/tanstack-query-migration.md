---
frameworks: [react]
title: 从 TanStack Query 迁移到 Reactive Data Client
sidebar_label: TanStack Query 迁移
---

import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# 从 TanStack Query 迁移

TanStack Query（React Query）会单独缓存每个查询键的响应，因此应用要靠在每次变更后让这些键失效来保持它们
一致。Reactive Data Client 会把响应[规范化](../concepts/normalization.md)为
[Entity](/rest/api/Entity)：变更的响应会更新所有展示该 Entity 的列表和详情，
大部分失效代码也就不再需要了。

迁移会用类型化的 endpoint 替换查询函数和键，用 [useSuspense()](../api/useSuspense.md)
和 [Controller](../api/Controller.md) 调用替换 hook，用 [DataProvider](../api/DataProvider.md) 替换 `QueryClient`。
[步骤](#steps)给出了顺序；[API 对照表](#api-map)给出了每个 TanStack Query API 的替代方案。

<SiteOnly>

## 用你的编程 agent 迁移 {#agent}

把下面的内容粘贴到 agent 的对话框中：

```prompt
Migrate this app from TanStack Query to Reactive Data Client. Install the setup skill first: `npx skills add reactive/data-client --skill data-client-setup -y`, then read `.agents/skills/data-client-setup/SKILL.md` and follow it.
```

setup skill 遵循本指南。像审查队友的代码一样审查它的 diff。

</SiteOnly>

<AgentOnly>

要把应用从 TanStack Query 迁移过来，请在项目根目录安装 setup skill，然后阅读
`.agents/skills/data-client-setup/SKILL.md` 并按其操作：

```bash
npx skills add reactive/data-client --skill data-client-setup -y
```

</AgentOnly>

## 步骤 {#steps}

每完成一步，都要保证应用的测试通过；它们能证明行为没有改变。

1. **Endpoint 和 schema。** 把每个查询函数和变更函数变成一个 endpoint：按照这些函数所调用的 HTTP 库（axios、fetch、ky）
   对应的 [REST 配置](/rest)操作，然后为每个 endpoint 提供一个由 [Entity](/rest/api/Entity) 构建的
   `schema`。没有 schema 就不会进行任何规范化，你也就需要保留
   每一处 `invalidateQueries` 调用。把 Entity 和 endpoint 放在一个所有功能模块都能导入的文件夹中（比如
   `src/resources/`），而不是放在各功能模块的 `api/` 文件夹中，即使查询 hook 原来就在那里：一个功能模块中的变更
   经常会更新另一个功能模块的 Entity。如果 lint 规则限制了文件夹之间的导入
   （`import/no-restricted-paths`、`eslint-plugin-boundaries`、Nx 模块边界），请使用它们允许的共享层。
2. **Provider。** 用 `DataProvider` 替换 `QueryClientProvider`（[Provider](#provider)）。
3. **读取。** 在渲染数据的组件中，用 `useSuspense()` 替换 `useQuery()` 和 `useSuspenseQuery()`
   （[读取](#reads)）。
4. **变更。** 用 `ctrl.fetch()` 替换 `useMutation()`，并删除因规范化而变得
   不再需要的失效代码（[变更](#mutations)）。
5. **Loader 和预取。** 在路由 loader 和悬停预取中，用
   `ctrl.fetchIfStale()` 替换 `queryClient`（[Loader 和预取](#loaders)）。
6. **无限查询。** 用 [Collection](/rest/api/Collection) 和 `getPage` 替换 `useInfiniteQuery()`
   （[无限查询](#infinite)）。
7. **身份认证。** 替换基于 TanStack Query 构建的身份认证库，比如 `react-query-auth`（[身份认证](#auth)）。
8. **测试。** 替换测试 wrapper 中的 `QueryClientProvider`，以及对加载指示器的假设（[测试](#tests)）。
9. **清理。** 删除查询键工厂、`queryOptions()` 辅助函数以及类似 `lib/react-query.ts` 的配置。当没有文件再导入
   `@tanstack/react-query` 和 `@tanstack/react-query-devtools` 时，卸载它们。

## API 对照表 {#api-map}

| TanStack Query | Data Client |
| --- | --- |
| `queryFn` + `queryKey`、`queryOptions()` | 一个带有 `schema` 的 endpoint。endpoint 及其参数就是键，因此不再需要键工厂 |
| `useQuery()`、`useSuspenseQuery()` | `useSuspense(endpoint, args)`：加载状态交给最近的 `<Suspense>`，错误交给最近的 Error Boundary，并且 `data` 永远不会是 `undefined` |
| 组件自己渲染加载指示器或错误的 `useQuery()` | [useDLE()](../api/useDLE.md)：`{ data, loading, error }` |
| `enabled: false` | 用 `null` 代替参数：`useSuspense(endpoint, id ? { id } : null)` 返回 `undefined`，且不获取任何东西 |
| `select` | 在渲染中计算，或使用通过 [useQuery()](../api/useQuery.md) 读取的 [Query](/rest/api/Query) schema |
| `useQueries()` | 对每一个使用 [useFetch()](../api/useFetch.md)，再使用 React 的 `use()`：它们会并行获取 |
| `staleTime` | endpoint 或基类上的 [dataExpiryLength](../concepts/expiry-policy.md#endpointdataexpirylength)。默认为 60 秒（TanStack Query 的默认值为 0） |
| `gcTime` | `DataProvider` 的 [gcPolicy](../api/DataProvider.md#gcPolicy) |
| `retry` | 删除它：Data Client 没有重试循环。出错的请求会在 `errorExpiryLength`（默认 1 秒）之后、有组件需要它时再次获取，类似 TanStack Query 的 `retry: false` |
| `refetchInterval` | endpoint 上的 `pollFrequency`，通过 [useLive()](../api/useLive.md) 读取 |
| `refetchOnWindowFocus` | 删除它：Data Client 不会在窗口获得焦点时重新获取 |
| `placeholderData: keepPreviousData` | 在 `startTransition()` 中修改参数（对于输入框则使用 [useDebounce()](../api/useDebounce.md)）：React 会在下一份数据加载期间继续展示当前数据 |
| 来自列表查询的 `initialData` | 删除它：当详情 endpoint 的 schema 是该 Entity 时，只要列表的数据仍然新鲜，列表加载过的 Entity 就会在详情页直接渲染，无需获取 |
| `useMutation()` | 在事件处理函数中调用来自 [useController()](../api/useController.md) 的 `ctrl.fetch(endpoint, ...args)` |
| 变更的 `isPending`、`error` | [useLoading()](../api/useLoading.md)：`const [run, isPending, error] = useLoading(fn, deps)` |
| `isSuccess`、`onSuccess`、`onError` | 写在 `await ctrl.fetch()` 之后或外围的代码（[变更](#mutations)） |
| 更新后的 `invalidateQueries()` | 当响应就是更新后的 Entity 时，删除它 |
| 创建后的 `invalidateQueries()` | `ctrl.fetch(Resource.getList.push, body)`（或 `unshift`）；编号分页有所不同（[变更](#mutations)） |
| 删除后的 `invalidateQueries()` | 删除它：`resource().delete`（或 `schema.Invalidate` schema）会把该 Entity 从每个列表中移除 |
| 针对响应中未包含的数据（计数、总计）的 `invalidateQueries()` | `ctrl.expireAll(endpoint)`：已挂载的组件会重新获取 |
| `refetchQueries()` | `ctrl.fetch(endpoint, args)` |
| `setQueryData()` | `ctrl.setResponse(endpoint, args, response)`；对于 Entity，使用 `ctrl.set(Entity, args, value)` |
| `getQueryData()` | 在组件中使用 [useCache()](../api/useCache.md)。在其他地方使用 `ctrl.get(schema, args, ctrl.getState())` |
| `prefetchQuery()`、`ensureQueryData()`、`getQueryData() ?? fetchQuery()` | `ctrl.fetchIfStale(endpoint, args)` |
| `fetchQuery()` | `ctrl.fetch(endpoint, args)` |
| `onMutate` 乐观更新与回滚 | endpoint 上的 [getOptimisticResponse()](/rest/guides/optimistic-updates)：Data Client 会在出错时回滚 |
| `useInfiniteQuery()` | 一个 [Collection](/rest/api/Collection) 和 `ctrl.fetch(endpoint.getPage, args)`（[无限查询](#infinite)） |
| 登出时的 `queryClient.clear()`、`removeQueries()` | `ctrl.resetEntireStore()` |
| `QueryClientProvider`、`new QueryClient()` | `DataProvider` |
| `useQueryClient()` | `useController()` |
| `ReactQueryDevtools` | 删除它：`DataProvider` 会在开发环境中添加 [DevTools](../getting-started/debugging.md) |
| `HydrationBoundary`、`dehydrate()` | [服务端渲染](./ssr.md) |

:::warning

Data Client 自己的 [useQuery()](../api/useQuery.md) 并不是 TanStack Query 的那个。它从 store 中读取 schema，从不
获取。请用 `useSuspense()` 或 `useDLE()` 替换 TanStack Query 的 `useQuery()`。

:::

## Provider {#provider}

把 `DataProvider` 放在根部，位于应用的其他 provider 和 `<Suspense>` 边界之外，而不是放在原来
`QueryClientProvider` 所在的位置。它的后备边界（在开发环境中显示 "Uncaught Suspense"）会先于它上方的任何
边界捕获。

```tsx title="provider.tsx"
import { DataProvider } from '@data-client/react';
import { Suspense, type ReactNode } from 'react';

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider>
    <Suspense fallback={<Loading />}>{children}</Suspense>
  </DataProvider>
);
```

`DataProvider` 会创建自己的 store，因此不需要创建 client。按照 [API 对照表](#api-map)所列，把 `QueryClient` 的 `defaultOptions` 移到基础
endpoint 类中。

## 读取 {#reads}

在渲染数据的组件中调用 `useSuspense()`，并删除各功能模块中包装 `useQuery()` 的 `useIssues()` hook。
请求相同 endpoint 和参数的两个组件会共享一次获取和一个 store 条目，因此
共享 hook 没有任何好处，而且 hook 会隐藏组件的依赖。

```ts title="Before"
export const issueKeys = {
  all: ['issues'] as const,
  list: (page: number) => [...issueKeys.all, 'list', page] as const,
  detail: (id: number) => [...issueKeys.all, 'detail', id] as const,
};

export const useIssues = (page: number) =>
  useQuery({ queryKey: issueKeys.list(page), queryFn: () => fetchIssues(page) });
```

```tsx title="Before, in IssueTable" nocheck
const { data, isLoading, isError } = useIssues(page);
if (isLoading) return <TableSkeleton />;
if (isError) return <ErrorBanner />;
return <Table rows={data?.results ?? []} />;
```

```tsx title="After"
import { useSuspense } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export function IssueTable({ page }: { page: number }) {
  const { results: issues, pagination } = useSuspense(IssueResource.getList, {
    page,
  });
  return (
    <table>
      <caption>
        Page {pagination.page} of {pagination.pageCount}
      </caption>
      <tbody>
        {issues.map(issue => (
          <tr key={issue.id}>
            <td>{issue.title}</td>
            <td>{issue.state}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`isLoading` 分支移到 `<Suspense>` 的 fallback 中，`isError` 分支移到 Error Boundary 中；
[AsyncBoundary](../api/AsyncBoundary.md) 同时具备两者。保留应用自己的骨架屏和错误横幅作为它们的 fallback。
`?? []` 防护也不再需要，因为 `useSuspense()` 只会在数据就绪后才返回。

同一组件中的两个 `useSuspense()` 调用会依次加载。当两者都不依赖对方的数据时，用
`useFetch()` 同时发起它们，再用 `use()` 读取（[并行数据加载](../api/useFetch.md#parallel-data-loading)）。

### 信封响应 {#envelope-responses}

当 API 包装了响应时，比如 `{ "results": [...], "pagination": {...} }`，请在 schema 中描述这个信封，
而不是把它解包，这样组件就能继续读取 `pagination`：

```ts title="resources/Issue.ts"
import { Entity, resource } from '@data-client/rest';

export class Issue extends Entity {
  id = 0;
  title = '';
  state: 'open' | 'closed' = 'open';
  assignee = '';

  static key = 'Issue';
}

interface Pagination {
  page: number;
  pageCount: number;
}

export const IssueResource = resource({
  path: '/issues/:id',
  searchParams: {} as { page?: number },
  schema: Issue,
}).extend(Base => ({
  getList: Base.getList.extend({
    schema: { results: [Issue], pagination: {} as Pagination },
  }),
  // a new issue shifts every numbered page, so this POST joins no list: callers expire it
  create: Base.getList.push.extend({ schema: Issue }),
}));
```

`searchParams` 为列表的 `page` 参数提供类型。`create` 复用列表的 `POST`，用普通的 `Issue` schema 代替
列表的 Collection；[变更](#mutations)一节说明了何时使用它。当单个条目
也被包装时，比如 `{ "data": {...} }`，用同样的方式扩展 `get`：`Base.get.extend({ schema: { data: Issue } })`。

## 变更 {#mutations}

在应用原来调用 `mutate()` 的地方调用 `ctrl.fetch()`。`onSuccess` 中的逻辑放在 `await` 之后；`onError` 中的逻辑放在
`catch` 中。用 `useLoading()` 跟踪 pending 和错误状态。

```ts title="Before"
export const useCloseIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => patchIssue(id, { state: 'closed' }),
    onSuccess: issue => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issue.id) });
      toast(`Closed #${issue.id}`);
    },
    onError: () => toast('Could not close the issue'),
  });
};
```

```tsx title="After"
import { useController, useLoading } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export function CloseIssueButton({ id }: { id: number }) {
  const ctrl = useController();
  const [close, isPending] = useLoading(async () => {
    try {
      await ctrl.fetch(IssueResource.partialUpdate, { id }, { state: 'closed' });
      toast(`Closed #${id}`);
    } catch {
      toast('Could not close the issue');
    }
  }, [ctrl, id]);
  return (
    <button onClick={close} disabled={isPending}>
      Close issue
    </button>
  );
}
```

`invalidateQueries()` 调用不见了：响应就是更新后的 `Issue`，因此表格和详情页都会
显示它已关闭。TanStack Query 应用通常会让详情键失效，却不会让每个列表键失效，因此列表会显示过时的
数据，直到它们过期；迁移之后就不会这样了。

根据响应决定如何处理每一处 `invalidateQueries()` 和 `refetchQueries()` 调用（更多示例见
[变更](../getting-started/mutations.md)）：

- **响应是被修改的 Entity**（更新、部分更新）：删除该调用，除非这次修改会让 Entity 在
  筛选或排序后的列表之间移动。关闭一个 issue 会在所有地方更新它，但不会把它从缓存的
  `?state=open` 列表中移除，也不会把它加入 `?state=closed` 列表；用 `ctrl.expireAll(Resource.getList)` 保持这些列表正确。
- **创建**：获取列表的 `push`（或 `unshift`）endpoint，而不是普通的 `POST`，新的 Entity 就会加入每个
  匹配的列表。这需要列表的 schema 中有一个 [Collection](/rest/api/Collection)：`resource()` 默认就有，
  而信封需要把它放在内部，比如 `results: new Collection([Issue])`。对于拆分为
  编号分页的列表，新条目会让每一页发生偏移，此时请添加一个普通的 `POST` endpoint（即
  [信封示例](#envelope-responses)中的 `create`：`Base.getList.push.extend({ schema: Issue })`），然后调用
  `ctrl.expireAll(Resource.getList)`。
- **删除**：`resource().delete` 会把该 Entity 从每个列表中移除。对于自定义 endpoint，请使用
  `schema: new schema.Invalidate(MyEntity)`。对于拆分为编号分页的列表，还要调用
  `ctrl.expireAll(Resource.getList)`：服务器上后面的条目会往前移一页，而缓存的页面无从得知。
- **响应中未包含的数据**（计数、另一个资源的总计）：`ctrl.expireAll(endpoint)`，或者在响应中返回
  它（[副作用](/rest/guides/side-effects)）。

### 成功状态 {#success-state}

`useLoading()` 没有 `isSuccess`，而且它返回的函数永远不会 reject：它会把错误存起来。因此请在传给 `useLoading()` 的函数中、
`await ctrl.fetch()` 之后关闭表单或对话框，而不是在调用
返回的函数之后。要保留一个成功标志：

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

## Loader 和预取 {#loaders}

接收 `queryClient` 的路由 loader 改为接收 Controller。`useController()` 在每次渲染时都返回同一个
Controller，因此可以放心地用它来创建路由。

```ts title="Before"
export const issueLoader =
  (queryClient: QueryClient) =>
  ({ params }: LoaderFunctionArgs) =>
    queryClient.ensureQueryData({
      queryKey: issueKeys.detail(Number(params.issueId)),
      queryFn: () => fetchIssue(Number(params.issueId)),
    });
```

```ts title="After"
import type { Controller } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { issueId?: string } }) =>
    ctrl.fetchIfStale(IssueResource.get, { id: Number(params.issueId) });
```

`fetchIfStale()` 只会在数据缺失或过时时获取。悬停或聚焦预取也可以使用它：
`onMouseEnter={() => ctrl.fetchIfStale(IssueResource.get, { id })}`。要加载多个 endpoint，可以对多个
`fetchIfStale()` 调用使用 `Promise.all()`。

## 无限查询 {#infinite}

`useInfiniteQuery()` 会保存一个页面数组。Data Client 只保存一个列表：每个新页面都会追加到其中的
[Collection](/rest/api/Collection)。在 endpoint 上设置 `paginationField` 即可得到它的 `getPage` endpoint。

```ts title="resources/Note.ts"
import { Collection, Entity, RestEndpoint } from '@data-client/rest';

export class Note extends Entity {
  id = 0;
  text = '';
  author = '';

  static key = 'Note';
}

// every page of one issue's notes shares one list
const issueNotes = new Collection([Note], {
  argsKey: ({ issueId }: { issueId: number }) => ({ issueId }),
});

export const getNotes = new RestEndpoint({
  path: '/issues/:issueId/notes',
  searchParams: {} as { page?: number },
  schema: { results: issueNotes, nextPage: 0 as number | null },
  paginationField: 'page',
});

export const addNote = new RestEndpoint({
  path: '/issues/:issueId/notes',
  method: 'POST',
  body: {} as { text: string },
  schema: issueNotes.push,
});
```

`argsKey` 省略了 `page`，因此每一页以及 `push` endpoint 都会找到同一个列表。新的笔记无需
任何失效就会出现。

```tsx title="IssueNotes.tsx"
import { useController, useLoading, useSuspense } from '@data-client/react';
import { getNotes } from './resources/Note';

export function IssueNotes({ issueId }: { issueId: number }) {
  const { results: notes, nextPage } = useSuspense(getNotes, { issueId });
  const ctrl = useController();
  const [loadMore, isLoadingMore] = useLoading(
    async (page: number) => ctrl.fetch(getNotes.getPage, { issueId, page }),
    [ctrl, issueId],
  );
  return (
    <>
      <ul>
        {notes.map(note => (
          <li key={note.id}>
            {note.author}: {note.text}
          </li>
        ))}
      </ul>
      {nextPage !== null && (
        <button onClick={() => loadMore(nextPage)} disabled={isLoadingMore}>
          Show older notes
        </button>
      )}
    </>
  );
}
```

不再需要 `pages.flatMap()`。`getNextPageParam` 计算的内容和 `hasNextPage` 报告的内容都来自响应
（这里是 `nextPage`），`getPage` 会连同列表一起更新它。`isFetchingNextPage` 就是 `useLoading()` 的 pending 标志。
关于游标，请参阅[分页](/rest/guides/pagination)。

## 身份认证 {#auth}

像 `react-query-auth` 这样的库在 TanStack Query 之上提供了 `useUser()`、`useLogin()`、`useLogout()` 和 `AuthLoader`。
用 endpoint 重新构建它们：

```ts title="session.ts"
import { useController, useLoading, useSuspense } from '@data-client/react';
import { Entity, RestEndpoint } from '@data-client/rest';

class Account extends Entity {
  id = '';
  displayName = '';

  static key = 'Account';
}

const getSession = new RestEndpoint({
  path: '/session',
  schema: { account: Account },
});
const signIn = new RestEndpoint({
  path: '/session',
  method: 'POST',
  body: {} as { username: string; password: string },
  schema: { account: Account, token: '' },
});
const signOut = new RestEndpoint({ path: '/session', method: 'DELETE' });

export const useAccount = () => useSuspense(getSession).account;

export const useSignIn = (onSuccess?: () => void) => {
  const ctrl = useController();
  return useLoading(
    async (body: { username: string; password: string }) => {
      const { account } = await ctrl.fetch(signIn, body);
      // the signed-in account becomes the current one without refetching
      await ctrl.setResponse(getSession, { account });
      onSuccess?.();
    },
    [ctrl, onSuccess],
  );
};

export const useSignOut = (onSuccess?: () => void) => {
  const ctrl = useController();
  return useLoading(async () => {
    await ctrl.fetch(signOut);
    await ctrl.resetEntireStore();
    onSuccess?.();
  }, [ctrl, onSuccess]);
};
```

对于注册，把 `useSignIn()` 复制为 `useSignUp()`，并换成注册 endpoint 及其 body 类型。`AuthLoader` 不再需要：`useAccount()` 会挂起
到应用的 `<Suspense>` 边界，直到会话加载完成。这些 hook 包装的是操作，而不是数据绑定，因此
值得保留为 hook。

调用处的形式会发生变化：

- `useUser().data` 变成值本身：`useAccount()`。
- `useLogin({ onSuccess }).mutate(values)` 变成 `const [signIn, isPending] = useSignIn(onSuccess)`，然后
  `signIn(values)`。

`useAccount()` 需要 `/session` 在访客未登录时返回不含账户的响应，就像 `react-query-auth` 的 `userFn` 返回
`null` 一样。这样未登录的页面才能渲染，`resetEntireStore()` 之后的重新获取也会展示未登录状态。如果 API
返回 401，错误就会传到最近的 Error Boundary，因此请把这个状态码转换为未登录的响应：

```ts title="getSession.ts"
import { Entity, NetworkError, RestEndpoint } from '@data-client/rest';

class Account extends Entity {
  id = '';
  displayName = '';

  static key = 'Account';
}

export const getSession = new RestEndpoint({
  path: '/session',
  schema: { account: Account },
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    const response = await fetch(input, init);
    if (response.status === 401) {
      // parseResponse() reads JSON only when the Content-Type says so
      return new Response(JSON.stringify({ account: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) throw new NetworkError(response);
    return response;
  },
});
```

要在任何其他 401 响应时登出，请添加 [LogoutManager](../api/LogoutManager.md)；关于 token 存储，请参阅
[身份认证](/rest/guides/auth)。

## 测试 {#tests}

- 把测试 wrapper 中的 `QueryClientProvider`（以及每个测试中的 `new QueryClient()`）替换为 `DataProvider`，并在其中放置
  `<Suspense>`。每次挂载 `DataProvider` 都会从空的 store 开始。
- 等待加载指示器消失的辅助函数在数据已经在 store 中时会失败，因为那时没有任何东西
  会挂起。只在存在加载指示器时才等待：

  ```ts title="test-utils.ts"
  import { screen, waitForElementToBeRemoved } from '@testing-library/react';

  const loadingElements = () => screen.queryAllByTestId(/loading/i);

  export const waitForLoadingToFinish = async () => {
    if (loadingElements().length)
      await waitForElementToBeRemoved(loadingElements);
  };
  ```

- Mock 服务器（MSW、`nock`）无需改动即可继续工作。要在没有服务器的情况下基于 fixture 渲染，请使用
  [MockResolver](../api/MockResolver.md)。
- 针对查询键或 `queryClient` 状态的断言不再需要；请对渲染出的内容进行断言。

## 检查迁移结果 {#check}

- 没有文件导入 `@tanstack/react-query`，也没有残留任何 `queryKey`、`queryOptions` 或 `useQueryClient`。
- 每个返回 Entity 的 endpoint 都有 `schema`。
- linter 通过（包括其导入边界规则），并且没有任何功能模块文件夹定义 Entity。
- 每个捕获 `useSuspense()` 的 `<Suspense>` 或 `AsyncBoundary` 都位于 `DataProvider` 内部。
- 类型检查、单元测试和端到端测试都通过。
- 变更之后，每个展示该 Entity 的页面无需刷新就能显示这一改动。一个在详情页编辑条目、然后
  返回列表的测试就能证明这一点。
