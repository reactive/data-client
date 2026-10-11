---
title: Endpoint - 强类型的 API 定义
sidebar_label: Endpoint
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import HooksPlayground from '@site/src/components/HooksPlayground';

# Endpoint

`Endpoint` 适用于任何异步函数（即返回 Promise 的函数）。

`Endpoints` 定义了一套强类型的标准接口，描述相关的元数据和生命周期，
可供 Reactive Data Client 及其他 store 使用。

包：[@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint)

:::tip

Endpoint 是一个与协议无关的类。建议改用针对特定协议的模式：
[REST](./RestEndpoint.md)、[GraphQL](/graphql/api/GQLEndpoint)
或 [getImage](/docs/guides/img-media#just-images)。

:::

<details>
<summary><b>接口</b></summary>

<Tabs
defaultValue="Interface"
values={[
{ label: 'Interface', value: 'Interface' },
{ label: 'Class', value: 'Class' },
{ label: 'EndpointExtraOptions', value: 'EndpointExtraOptions' },
]}>
<TabItem value="Interface">

```typescript
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
```

</TabItem>
<TabItem value="Class">

```typescript
class Endpoint<F extends (...args: any) => Promise<any>>
  implements EndpointInterface
{
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  fetch: F;

  extend(options: EndpointOptions): Endpoint;
}

export interface EndpointOptions extends EndpointExtraOptions {
  key?: (params: any) => string;
  sideEffect?: true | undefined;
  schema?: Schema;
}
```

</TabItem>
<TabItem value="EndpointExtraOptions">

```typescript
export interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in milliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly getOptimisticResponse?: (
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ) => ResolveType<F>;
  /** Determines whether to throw or fallback to */
  readonly errorPolicy?: (error: any) => 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
}
```

</TabItem>
</Tabs>

</details>

## 用法 {#usage}

`Endpoint` 让现有的异步函数可以在任何 Reactive Data Client 上下文中使用，并享有完整的 TypeScript 类型约束。

<HooksPlayground defaultOpen="n">

```ts title="interface" collapsed
export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
```

```ts title="api" {12}
import { Endpoint } from '@data-client/rest';
import { Todo } from './interface';

const getTodoOriginal = (id: number): Promise<Todo> =>
  Promise.resolve({
    id,
    title: 'delectus aut autem ' + id,
    completed: false,
    userId: 1,
  });

export const getTodo = new Endpoint(getTodoOriginal);
```

```tsx title="React"
import { useSuspense } from '@data-client/react';
import { getTodo } from './api';

function TodoDetail() {
  const todo = useSuspense(getTodo, 1);
  return <div>{todo.title}</div>;
}
render(<TodoDetail />);
```

</HooksPlayground>

### 共享配置 {#configuration-sharing}

请使用 [Endpoint.extend()](#extend)，而不是 `{...getTodo}`（展开）

```ts
const getTodoNormalized = getTodo.extend({ schema: Todo });
const getTodoUpdatingEveryFiveSeconds = getTodo.extend({ pollFrequency: 5000 });
```

## 生命周期 {#lifecycle}

### 成功 {#success}

import SuccessLifecycle from '../diagrams/\_endpoint_success_lifecycle.mdx';

<SuccessLifecycle/>

### 错误 {#error}

import ErrorLifecycle from '../diagrams/\_endpoint_error_lifecycle.mdx';

<ErrorLifecycle/>

## Endpoint 成员 {#endpoint-members}

成员同时也是选项（构造函数的第二个参数）。它们都不是必填的，其中前几个
有默认值。

### key: (params) => string {#key}

序列化参数，用于在全局 store 中构建查找键。

默认值：

```typescript
`${this.name} ${JSON.stringify(params)}`;
```

:::warning[覆盖]

覆盖 `key` 时，如果你打算使用 [testKey](#testKey) 方法，
务必同时提供一个相应更新的版本。

:::

### testKey(key): boolean {#testKey}

如果提供的（fetch）[key](#key) 与此 endpoint 匹配，则返回 `true`。

它用于配合 [&lt;MockResolver /&gt;](/docs/api/MockResolver) 使用的模拟 interceptor

### name: string {#name}

在 [key](#key) 中用于区分不同的 endpoint。应当全局唯一。

默认为 `this.fetch.name`

:::warning

在会更改函数名的生产构建中，这可能会失效。
这通常被称为[函数名混淆（mangling）](https://terser.org/docs/api-reference#mangle-options)。

这种情况下，你可以覆盖 `name`，或禁用函数名混淆。

:::

### sideEffect: boolean {#sideeffect}

用于表示该 endpoint 可能有副作用（非幂等）。这会禁止它
与 [useSuspense()](/docs/api/useSuspense) 或 [useFetch()](/docs/api/useFetch) 一起使用，因为它们请求该
endpoint 的次数不可预测。

### schema: Schema {#schema}

以声明式的方式定义如何[处理响应](./schema)

- 在[哪里](./schema)会出现 [Entity](./Entity.md)
- 用于[反序列化字段](/rest/guides/network-transform#deserializing-fields)的函数

不提供此选项意味着不会提取任何 Entity。

```tsx
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new Endpoint(
    ({ id }) => fetch(`/users/${id}`),
    { schema: User }
);
```

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

### extend(options): Endpoint {#extend}

可用于进一步自定义 endpoint 的定义

```typescript
const getUser = new Endpoint(({ id }) => fetch(`/users/${id}`));


const getUserNormalized = getUser.extend({ schema: User });
```

除了这些成员之外，还可以传入 `fetch` 来覆盖获取函数。

## 示例 {#examples}

<Tabs
defaultValue="Basic"
values={[
{ label: 'Basic', value: 'Basic' },
{ label: 'With Schema', value: 'With Schema' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Basic">

```typescript
import { Endpoint } from '@data-client/endpoint';

const UserDetail = new Endpoint(
  ({ id }) => fetch(`/users/${id}`).then(res => res.json())
);
```

</TabItem>
<TabItem value="With Schema">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const UserDetail = new Endpoint(
  ({ id }) => fetch(`/users/${id}`).then(res => res.json()),
  { schema: User }
);
```

</TabItem>
<TabItem value="List">

```typescript
import { Endpoint, Entity } from '@data-client/endpoint';

class User extends Entity {
  id = '';
  username = '';
}

const UserList = new Endpoint(
  () => fetch(`/users/`).then(res => res.json()),
  { schema: [User] }
);
```

</TabItem>
</Tabs>

<Tabs
defaultValue="React"
values={[
{ label: 'React', value: 'React' },
{ label: 'JS/Node Schema', value: 'JS/Node' },
]}>
<TabItem value="React">

```tsx
import { useSuspense, useController } from '@data-client/react';
import { UserDetail } from './api/User';
import UserForm from './UserForm';

function UserProfile({ id }: { id: string }) {
  const user = useSuspense(UserDetail, { id });
  const ctrl = useController();

  return <UserForm user={user} onSubmit={() => ctrl.fetch(UserDetail)} />;
}
```

</TabItem>
<TabItem value="JS/Node">

```typescript
const user = await UserDetail({ id: '5' });
console.log(user);
```

</TabItem>
</Tabs>

### 更多内容 {#additional}

- [分页](../guides/pagination.md)
- [模拟尚未完成的 endpoint](../guides/mocking-unfinished.md)
- [乐观更新](../guides/optimistic-updates.md)

## 动机 {#motivation}

以下两者是有区别的：

- 网络 API 是什么
  - 如何发起请求、预期的响应字段等
- 它如何被使用
  - 绑定数据、轮询、触发命令式获取等

因此，在这两个概念之间清晰地分离关注点
会带来很多好处。

借助 `TypeScript Standard Endpoints`，我们定义了一套在
TypeScript 中声明网络 API 定义的标准。

- 让 API 作者可以发布包含其 API 接口的 npm 包
- 任何支持该标准的库都可以使用这些定义，便于在 Vue、React、Angular 等库之间通用
- 由于输出非常精简，编写代码生成流程会容易得多
- 产品开发者可以在行为各异的多种场景中使用这些定义
- 产品开发者可以轻松地在行为需求不同的平台（如 React Native 和 React Web）之间共享代码

### Endpoint 包含什么 {#whats-in-an-endpoint}

- 一个用于解析结果的函数
- 一个用于唯一地存储这些结果的函数
- 可选：关于如何将数据存储到规范化缓存中的信息
- 可选：该请求是否可能有副作用——以防止重复调用
