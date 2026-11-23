---
frameworks: [react]
title: 性能优化检查
sidebar_label: 性能优化检查
description: 找出基于 Data Client 的应用可能缺少的提速手段，例如用列表数据渲染详情页、不等待次要数据的 loader，以及乐观更新。
---

import DiffEditor from '@site/src/components/DiffEditor';

# 性能优化检查

Data Client 能让应用比单纯迁移后更快。请在迁移之后执行这项检查，也可以随时对
已经使用 Data Client 的应用执行。

迁移本应已经带来[内置收益](#built-in)：它们只需很少的代码，就能修复过时或缓慢的行为，
因此请确认它们已经到位，并补上缺少的部分。[有取舍的改动](#tradeoffs)需要额外的
代码，或者会改变用户所见的内容，例如加载状态何时显示、改动何时出现。它们是一个单独的、
可选的阶段：一次做一项，保持测试通过，并跳过你不想要的任何一项。

## 先测量 {#measure}

在做任何改动之前记录基线，并在每次改动后再次测量：

- **请求：** 在浏览器的 Network 面板中，统计每次导航以及每次变更后的读取请求数。
- **更新耗时：** 在 Performance 面板中，测量从点击到屏幕显示结果的时间，而不只是
  下一次绘制。对 CPU 进行节流并添加网络延迟，让数字接近真实设备。
- **渲染：** React DevTools Profiler 会显示更新后有哪些组件渲染。

如果没有浏览器，就根据代码及其测试统计每个流程发出的请求数，并说明你是如何统计的。

## 内置收益 {#built-in}

### 用列表数据渲染详情 {#list-detail}

如果详情 endpoint 的 schema 包含列表的 [Entity](/rest/api/Entity)，那么在数据仍然新鲜时，它会直接渲染列表已加载的条目，
无需获取。查找使用的是 endpoint 的参数，因此参数必须使用 Entity 的 `pk()` 所读取的字段名
（`{ id }`，而不是 `{ issueId }`），或者其 [indexes](/rest/api/Entity#indexes) 中的字段。

- **查找：** 没有 schema 的详情 endpoint，或者 schema 中缺少该 Entity 的详情 endpoint；既不指明
  主键也不指明索引的详情参数（`{ slug }` 却没有 `static indexes = ['slug']`）；手动复制到
  详情中的列表数据。
- **改动：** 把详情的 schema 设为该 Entity，或者包含它的对象，例如 `{ data: Issue }`。对于其他查找
  字段，请添加索引，而不是重命名参数。删除复制代码。当列表返回的字段少于
  详情时，为列表提供一个摘要 Entity，并让详情的 Entity 以相同的 `key` 和一个
  `validate()` 继承它，这样详情仍会获取完整条目（[部分 Entity](/rest/guides/partial-entities)）。
- **用户所见：** 从列表打开时，详情页会立即显示。只要列表仍然新鲜并且包含详情所需的每个字段，
  它就不会发出请求。

### 处处使用同一个 Entity {#entities}

每个展示服务器对象的地方都读取同一个 Entity，因此一个响应就能更新所有地方。

- **查找：** 存放带有自身 id 的对象、却没有 [`static schema`](/rest/api/Entity#schema) 条目的 Entity 字段；
  同一个服务器对象对应两个 key 不同的 Entity 类（详情 Entity 以相同 `key` 继承的摘要 Entity
  没有问题）；没有 schema 的更新 endpoint；更新后的 `ctrl.expireAll()`、
  `ctrl.invalidate()` 或重新获取。
- **改动：** 在 `static schema` 中嵌套 Entity（`{ author: User, labels: [Label] }`），把该
  Entity 设为更新 endpoint 的 schema，并删除重新获取。
- **用户所见：** 编辑会立即在每一行、每张卡片和详情中显示，无需请求。

### 变更就地更新列表 {#lists}

- **查找：** 在创建、删除或把条目移到另一个过滤列表的改动之后，对列表调用 `ctrl.expireAll()`、`ctrl.invalidate()` 或重新获取。
- **改动：** 通过列表 [Collection](/rest/api/Collection) 的 `push` 或 `unshift` endpoint 创建；用
  `resource().delete` 或 [Invalidate](/rest/api/Invalidate) schema 删除；用 Collection 的
  [`move`](/rest/api/RestEndpoint#move) endpoint 移动。以下情况保留 `expireAll()`：编号分页（后续条目会移位）；
  由服务器决定顺序或成员的列表；以及响应中不包含的数据，例如计数和
  总数。
- **用户所见：** 新增、移除或移动的条目无需重新加载列表即可显示。

### 读取跳过新鲜数据 {#fetch-if-stale}

- **查找：** 发起获取的 `useEffect()`；在路由 loader 或预取处理函数中对读取 endpoint 调用 `ctrl.fetch()`。
- **改动：** 组件用 `useSuspense()` 或 [useFetch()](../api/useFetch.md) 读取。只有无法运行 hook 的
  代码（例如路由 loader 和悬停预取）才调用 `ctrl.fetchIfStale()`。`ctrl.fetch()` 总是会发出请求，即使
  store 中有新鲜数据，因此只在用户要求刷新的地方保留它。
- **用户所见：** 没有变化；每次导航的请求更少。

## 有取舍的改动 {#tradeoffs}

### Loader 不等待次要数据 {#loaders}

await 每个请求的路由 loader 会让页面等待最慢的那个请求，即使主条目来自
列表。在通过 transition 切换路由的路由器中，启动每个 `fetchIfStale()` 时都不要 await：页面
会渲染已缓存的内容，并为其余内容挂起，同时保留当前页面。为每个读取
次要数据的组件提供自己的 [AsyncBoundary](../api/AsyncBoundary.md)，这样它在加载时不会阻塞页面。如果页面
渲染 loader 的返回值，就只返回主条目，如[路由 loader](../api/Controller.md#fetchIfStale-loaders)
所示。

<DiffEditor>

```ts title="Before"
export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { issueId?: string } }) => {
    const id = Number(params.issueId);
    return Promise.all([
      ctrl.fetchIfStale(IssueResource.get, { id }),
      ctrl.fetchIfStale(getNotes, { issueId: id }),
    ]);
  };
```

```ts title="After"
export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { issueId?: string } }) => {
    const id = Number(params.issueId);
    // callout: Not awaited: the route changes at once, and the page suspends inside the transition until the issue arrives.
    ctrl.fetchIfStale(IssueResource.get, { id });
    // callout: IssueNotes suspends inside its own boundary, which also shows a failure.
    ctrl.fetchIfStale(getNotes, { issueId: id });
    return null;
  };
```

</DiffEditor>

```tsx title="IssuePage.tsx"
import { AsyncBoundary } from '@data-client/react';
import IssueDetail from './IssueDetail';
import IssueNotes from './IssueNotes';
import Spinner from './Spinner';

export default function IssuePage({ id }: { id: number }) {
  return (
    <>
      <IssueDetail id={id} />
      <AsyncBoundary fallback={<Spinner />}>
        <IssueNotes issueId={id} />
      </AsyncBoundary>
    </>
  );
}
```

- **查找：** `await` 或用 `Promise.all()` 等待多个请求的 loader；在页面主内容下方调用 `useSuspense()`、
  却没有自己边界的组件。
- **用户所见：** 页面会先显示，次要部分显示各自的加载状态。

### 根据意图预取 {#prefetch}

- **查找：** 指向 store 尚未持有其数据的页面、且所在路由没有 loader 的链接。
- **改动：** 在链接的 `onMouseEnter` 和 `onFocus` 中调用 `ctrl.fetchIfStale(endpoint, args)`，或者添加一个 loader。
- **用户所见：** 页面显示时没有加载状态。被悬停却未被点击的链接会多花一次请求。

### 过期时间与数据相符 {#expiry}

当组件下次读取时，Data Client 会重新获取早于其 endpoint 的 [`dataExpiryLength`](/rest/api/RestEndpoint#dataexpirylength)
（默认 60 秒）的数据。就地更新 store 的变更会在两次获取之间保持数据正确，
因此大多数数据可以保持新鲜更久。

- **查找：** 从 TanStack Query 的 `staleTime: 0` 照搬来的 `dataExpiryLength: 0`、极短的过期时间或 `invalidIfStale: true`；
  很少变化却保留默认值的数据，例如当前用户、设置或选项列表。
- **改动：** 移除这些覆盖，并对数据只会通过本应用改变的 endpoint 调高 `dataExpiryLength`。
- **用户所见：** 后台重新获取更少，回到某个页面时没有加载状态。在别处做出的改动
  会稍后才显示。

### 乐观更新 {#optimistic}

当客户端能够预测变更的结果时，立即显示它，并在请求失败时让 Data Client 回滚。
在 endpoint 上使用 [getOptimisticResponse()](/rest/guides/optimistic-updates)，或者在
[resource()](/rest/api/resource) 上使用 `optimistic: true`。`optimistic: true` 涵盖每个变更，包括创建。在服务器
响应之前，新条目会以随机的临时 key 存储，但它的 `id` 和 `pk()` 仍是 Entity 的默认值（例如
`0`），因此请用别的值作为其行的 key，并禁用它的其他变更；要只让某一个变更变成乐观的，请用
`resource().extend('partialUpdate', { ... })` 只给该 endpoint 添加 `getOptimisticResponse`。

- **查找：** 对更新、删除和创建调用的 `ctrl.fetch()`，且客户端能根据 body 和
  store 预测其响应。
- **用户所见：** 点击时改动立即出现。失败的请求会撤销改动，因此请继续显示它的错误。

### 在 Query 中派生视图 {#query}

- **查找：** 在渲染或 `useMemo()` 中对获取到的数据进行排序、过滤或分组。
- **改动：** 把 [Query](/rest/api/Query) 设为 endpoint 的 schema，并继续用 `useSuspense()` 读取它
  （[客户端排序](/rest/guides/sorting-client-side)）。它的结果会在组件之间记忆化，并且只在
  输入变化时重新计算。[useQuery()](../api/useQuery.md) 从不获取，因此只在数据
  已经在别处获取过的地方使用它。
- **用户所见：** 没有变化；大型列表中的更新渲染得更快。

### 并行读取 {#parallel}

- **查找：** 一个组件中有两个 `useSuspense()` 调用，且彼此都不需要对方的数据；子组件只在父组件的数据到达后
  才开始获取。
- **改动：** 用 [useFetch()](../api/useFetch.md#parallel-data-loading) 同时启动两者，再用 `use()` 读取它们，或者
  在路由 loader 中启动子组件的获取。在没有 `use()` 的 React 19 以下版本中，先为每个
  endpoint 调用 `useFetch()`，再分别调用 `useSuspense()`；这些读取会复用已在进行中的请求。
- **用户所见：** 页面更早加载完成。

### 改动期间保留当前数据 {#transitions}

- **查找：** 会闪现加载 fallback 的分页、过滤或搜索。
- **改动：** 在 `startTransition()` 中修改参数，对输入框使用 [useDebounce()](../api/useDebounce.md)。
- **用户所见：** 当前结果会一直保留，直到下一批结果就绪。

### 稳定的引用 {#references}

Data Client 会让每个 Entity 的对象保持不变，直到它发生变化，因此记忆化的组件和 React Compiler 会跳过
没有变化的行。

- **查找：** 在传给子组件之前，在渲染中被复制或重塑的 Entity（`{ ...issue }`、`issues.map(toViewModel)`）。
- **改动：** 直接传递 Entity 本身；把计算字段作为 getter 放在 Entity 类上。
- **用户所见：** 没有变化；每次更新后渲染的组件更少。

### React 19 和 React Compiler {#compiler}

[React Compiler](https://react.dev/learn/react-compiler) 会在构建时对组件和 hook 进行记忆化。配合上面的稳定
引用，store 更新后渲染的组件会更少。

- **查找：** package.json 中 `react` 低于 19；构建中没有 `babel-plugin-react-compiler`（Babel 或 Vite 配置、
  Next.js 配置中的 `reactCompiler`，或 Expo 的 app.json 中的 `experiments.reactCompiler`）。
- **在 React 19 上的改动：** 按照[安装指南](https://react.dev/learn/react-compiler/installation)操作，并开启
  `eslint-plugin-react-hooks` 的推荐规则。编译器会跳过违反
  [React 规则](https://react.dev/reference/rules)的组件，而 lint 规则会指出它们。保留现有的记忆化，
  并运行测试。
- **低于 React 19：** 升级 React 是一个独立的项目，因此不要在这次检查中进行。说明 React 19 能为
  这个应用带来什么：用于上文[并行读取](#parallel)的 `use()`，以及 19.2 中用于保留隐藏页面状态和渲染输出的
  [`<Activity>`](https://react.dev/reference/react/Activity)。然后询问
  是否要作为后续工作进行升级，附上[升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)，
  并提议同时添加编译器。借助 `react-compiler-runtime`，编译器也能在 React 17 和 18 上运行；只有在用户要求时，
  才在升级前添加它。
- **升级之前：** 用 `memo()` 包裹开销大的列表行，让 Entity 没有变化的行跳过渲染。
- **用户所见：** 没有变化。编译后的 JavaScript 更大，因此也要测量加载时间。

## 报告 {#report}

对于每个小节，记录你发现了什么、改动或跳过了什么及其原因，以及改动前后的数字。
