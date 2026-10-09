---
title: Entity - React 的声明式唯一对象
vue_title: Entity - Vue 的声明式唯一对象
sidebar_label: Entity
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# Entity

<div style={{float:'right'}}>

```ts
{
  Article: {
    '1': {
      id: '1',
      title: 'Entities define data',
    }
  }
}
```

</div>

`Entity` 定义一个_唯一_的对象。

[Entity.key](#key) + [Entity.pk()](#pk)（主键）使 store 可以采用[扁平查找表](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state)结构，从而实现高
性能、数据一致性和原子变更。

通过定义 [schema](#schema) 等静态成员并重写[生命周期方法](#lifecycle)，
`Entities` 可以自定义数据处理的生命周期。

## 用法 {#usage}

<TypeScriptEditor>

```typescript title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  username = '';

  static key = 'User';
  pk() {
    return this.id;
  }
}
```

```typescript title="Article"
import { Entity } from '@data-client/rest';
import { User } from './User';

export class Article extends Entity {
  id = '';
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Article';
  pk() {
    return this.id;
  }

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

</TypeScriptEditor>

[static schema](#schema) 是对需要处理的字段的声明式定义。
在本例中，`author` 是另一个需要提取的 `Entity`，而 `createdAt` 会从字符串
转换为 [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
对象。

:::tip

Entity 通过 [resource.schema](./resource.md#schema) 或
[RestEndpoint.schema](./RestEndpoint.md#schema) 绑定到 Endpoint

:::

:::tip

如果你已经定义好了自己的类，也可以使用 [EntityMixin](./EntityMixin.md)
来创建 Entity。

:::

重写其他静态成员可以自定义数据的生命周期，如下所示。

## 成员 {#members}

### pk(parent?, key?, args?): string | number | undefined {#pk}

<abbr title="主键">pk</abbr> 代表[_主键_](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS)，用于唯一标识一个 `Entity` 实例。
默认情况下，它返回 Entity 的 `id` 字段。

重写此方法可以使用其他字段，或用于其他情况，例如
多列主键。

#### undefined 值 {#undefined-value}

可以使用 `undefined` 作为默认值，表示该 Entity 尚未创建。
这在直接使用 [Entity.fromJS()](#fromJS) 初始化创建表单时
很有用。如果 `pk()` 返回 `undefined`，则认为它尚未持久化到服务器，
因此不会保留在缓存中。

#### 其他用途 {#other-uses}

由于 `pk()` 是唯一的，它为定义 :react[[JSX 列表 key](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)]:vue[[`v-for` key](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key)] 提供了一种一致的方式

:::react

```tsx nocheck
//....
return (
  <div>
    {results.map(result => (
      <TheThing key={result.pk()} thing={result} />
    ))}
  </div>
);
```

:::

:::vue

```html nocheck
<template>
  <div>
    <TheThing
      v-for="result in results"
      :key="result.pk()"
      :thing="result"
    />
  </div>
</template>
```

:::

#### 复合主键 {#composite-primary-keys}

当单个字段不足以唯一标识一个 Entity 时，你可以将多个
字段组合成复合键。这在嵌套资源或具有
多段标识符的资源中很常见。

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = '';
  title = '';

  pk() {
    // Composite key from owner, repo, and issue number
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';
}
```

当 Entity 数据没有直接包含键的所有组成部分时，你可以使用 [Entity.process()](#process)
从相关字段或 endpoint 参数中提取它们：

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = ''; // Contains: https://api.github.com/repos/{owner}/{repo}
  title = '';

  pk() {
    // Use owner/repo from process() which extracts from repositoryUrl
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';

  static process(input: any, parent: any, key: string, args: any[]) {
    // Extract owner and repo from the repositoryUrl
    const match = input.repositoryUrl?.match(/repos\/([^/]+)\/([^/]+)/);
    const owner = args[0]?.owner ?? match?.[1];
    const repo = args[0]?.repo ?? match?.[2];
    return { ...input, owner, repo };
  }
}
```

#### 单例 Entity {#singleton-entities}

如果在整个应用中某个 Entity 永远只有一个实例呢？你
其实不需要区分各个实例，因此 API 中很可能没有定义 `id` 或
类似的字段。这种情况下，你可以直接返回一个字面量，例如
'the_only_one'。

```typescript
pk() {
  return 'the_only_one';
}
```

假设你有

```typescript
const get = new RestEndpoint({
  path: '/options',
  schema: OptionsEntity,
});
export const OptionsResource = {
  get,
  partialUpdate: get.extend({ method: 'PATCH' }),
};
```

### static key: string {#key}

它定义的是 Entity 类型的 key，而不是某个实例的 key。它必须是全局
唯一的值。

:::warning

它默认为 `this.name`；但在会更改类名的生产构建中，这可能会失效。
这通常称为[类名混淆（mangling）](https://terser.org/docs/api-reference#mangle-options)。

这种情况下，你可以重写 `key`，或禁用类名混淆。

:::

```ts
class User extends Entity {
  id = '';
  username = '';

  pk() {
    return this.id;
  }
  // highlight-next-line
  static key = 'User';
}
```

### static schema: \{ [k: keyof this]: Schema } {#schema}

定义[关联 Entity](/rest/guides/relational-data) 成员，或
[字段反序列化](/rest/guides/network-transform#deserializing-fields)，例如 Date 和 BigNumber。

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/posts/:id'}),
args: [{ id: '123' }],
response: {
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
createdAt: '2019-01-23T06:07:48.311Z',
},
delay: 150,
},
]}>

```ts title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';

  pk() {
    return this.id;
  }
  static key = 'User';
}
```

```ts title="Post" {17-21}
import { Entity } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';
import { User } from './User';

export class Post extends Entity {
  id = '';
  author = User.fromJS();
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  content = '';
  title = '';

  pk() {
    return this.id;
  }
  static key = 'Post';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

:::react

```tsx title="PostPage" collapsed
import { RestEndpoint } from '@data-client/rest';
import { useSuspense } from '@data-client/react';
import { Post } from './Post';

export const getPost = new RestEndpoint({
  path: '/posts/:id',
  schema: Post,
});
function PostPage() {
  const post = useSuspense(getPost, { id: '123' });
  return (
    <div>
      <p>
        {post.content} - <cite>{post.author.name}</cite>
      </p>
      <time>{post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' })}</time>
    </div>
  );
}
render(<PostPage />);
```

:::

:::vue

```html title="PostPage.vue" collapsed
<script lang="ts">
  import { RestEndpoint } from '@data-client/rest';
  import { Post } from './Post';

  const getPost = new RestEndpoint({
    path: '/posts/:id',
    schema: Post,
  });
</script>

<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';

  const post = await useSuspense(getPost, { id: '123' });
</script>

<template>
  <div>
    <p>{{ post.content }} - <cite>{{ post.author.name }}</cite></p>
    <time>
      {{ post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' }) }}
    </time>
  </div>
</template>
```

:::

</FrameworkPlayground>

#### 可选成员 {#optional-members}

此处引用的 Entity，如果其在 Record 定义中的默认值本身
就是空值，则被视为“可选”

```typescript
class User extends Entity {
  friend: User | null = null; // this field is optional
  lastUpdated = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    friend: User,
    lastUpdated: Temporal.Instant.from,
  };
}
```

### static indexes?: (keyof this)[] {#indexes}

索引可以提升基于这些参数进行查找时的性能。将之后
想要作为查找参数发送的字段名（例如 `slug`、`username`）添加到
列表中。

:::note

不要把 `id` 之类的主键加入索引列表，因为它已经被优化过了。

:::

#### useSuspense() {#usesuspense}

配合 [useSuspense()](/docs/api/useSuspense)，它会尽可能从 Entity 表中提前推断出结果，
无需等待 fetch 完成即可渲染。当 Entity
缓存已经由其他请求（例如列表请求）填充时，这通常很有帮助。

```typescript
export class User extends Entity {
  id: number | undefined = undefined;
  username = '';
  email = '';
  isAdmin = false;

  // highlight-next-line
  static indexes = ['username' as const];
}
export const UserResource = resource({
  path: '/user/:id',
  schema: User,
});
```

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { UserResource } from './resources/User';

const user = useSuspense(UserResource.get, { username: 'bob' });
```

:::

:::vue

```ts
const user = await useSuspense(UserResource.get, { username: 'bob' });
```

:::

#### useQuery() {#usequery}

配合 [useQuery()](/docs/api/useQuery)，它让你可以访问在其他请求中获取到的结果——即使
没有可以获取它的 endpoint。

```typescript
class LatestPrice extends Entity {
  id = '';
  symbol = '';
  price = '0.0';

  static indexes = ['symbol' as const];
}
```

```typescript
class Asset extends Entity {
  id = '';
  price = '';

  static schema = {
    price: LatestPrice,
  };
}
const getAssets = new RestEndpoint({
  path: '/assets',
  schema: [Asset],
});
```

某个顶层组件：

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { getAssets } from './resources/Asset';

const assets = useSuspense(getAssets);
```

:::

:::vue

```ts
const assets = await useSuspense(getAssets);
```

:::

嵌套在下层：

```tsx
import { useQuery } from '@data-client/react';
import { LatestPrice } from './resources/LatestPrice';

const price = useQuery(LatestPrice, { symbol: 'BTC' });
```

### static maxEntityDepth?: number {#maxEntityDepth}

在反规范化期间限制 Entity 的嵌套深度，以防止在大型双向 Entity 图中
发生栈溢出。**默认值：64**

当双向关系形成包含大量唯一 Entity 的链条时
（例如 `Department → Building → Department → ...`），反规范化可能会递归
数千层。`maxEntityDepth` 会在指定深度截断解析——
超出限制的 Entity 在返回时，其嵌套的外键会保留为
未解析的 id，而不是完全反规范化的对象。

```typescript
class Department extends Entity {
  id = '';
  name = '';
  buildings: Building[] = [];

  pk() {
    return this.id;
  }
  static key = 'Department';
  // highlight-next-line
  static maxEntityDepth = 16;

  static schema = {
    buildings: [Building],
  };
}
```

:::tip

请在参与深层或宽泛双向关系的 Entity 上设置此项。
普通的 Entity 图（深度 < 10）永远不会接近默认限制。

对于不需要立即反规范化的关系，[Lazy](/rest/api/Lazy)
会完全跳过解析，让你通过 [useQuery](/docs/api/useQuery) 按需解析。

:::

## 生命周期 {#lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

import LifecycleMethods from '../shared/\_entity_lifecycle_methods.mdx';

<LifecycleMethods entitySyntax="Entity" />
