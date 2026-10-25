---
title: GQLEntity
---

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import { GQLEndpoint, GQLEntity } from '@data-client/graphql';
import { getPost } from './getPost.ts';

GraphQL 有[一种标准方式](https://graphql.org/learn/global-object-identification/)来定义 [pk](/rest/api/Entity#pk)，即使用 `id` 字段。

GQLEntity 自动带有一个 `id` 字段，用作 [pk](/rest/api/Entity#pk)。

:::info extends

`GQLEntity` 继承自 [Entity](/rest/api/Entity)

:::

## 用法 {#usage}

<TypeScriptEditor>

```typescript title="User" collapsed
import { GQLEntity } from '@data-client/graphql';

export class User extends GQLEntity {
  username = '';
}
```

```typescript title="Article"
import { GQLEntity } from '@data-client/graphql';
import { User } from './User';

export class Article extends GQLEntity {
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

</TypeScriptEditor>

[static schema](#schema) 以声明式的方式定义需要处理的字段。
在这个例子中，`author` 是另一个需要提取的 `Entity`，而 `createdAt` 会从字符串转换为
[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
对象。

:::tip

Entity 通过 `query` 或 `mutate` 的第二个参数绑定到 [GQLEndpoint](./GQLEndpoint.md)。

:::

如下所示，覆盖其他静态成员可以自定义数据生命周期。

## 数据生命周期 {#data-lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

## 方法 {#methods}

### pk(parent?, key?, args?): string? {#pk}

PK 是 _primary key_（主键）的缩写，旨在为任意 `Entity` 提供一种[获取键标识符的
标准方式](https://graphql.org/learn/global-object-identification/)。

GraphQL 使用 `id` 字段作为[标准的全局对象标识符](https://graphql.org/learn/global-object-identification/)。

```ts
pk() {
  return this.id;
}
```

### static key: string {#key}

它定义的是 Entity 本身（而不是实例）的键。这个值必须
全局唯一。

:::warning

它默认为 `this.name`；但在会修改类名的生产构建中，这可能会失效。
这通常被称为[类名混淆](https://terser.org/docs/api-reference#mangle-options)。

这种情况下，你可以覆盖 `key`，或者禁用类名混淆。

:::

```ts
class User extends GQLEntity {
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### static process(input, parent, key, args): processedEntity {#process}

在该 Entity 规范化开始时运行。返回值会保存到 store 中。

**默认**只是简单地复制响应（`{...input}`）

如何通过覆盖它来[为关系型数据构建反向查找](/rest/guides/relational-data#reverse-lookups)

### static mergeWithStore(existingMeta, incomingMeta, existing, incoming): mergedValue {#mergeWithStore}

```typescript
static mergeWithStore(
  existingMeta: {
    date: number;
    fetchedAt: number;
  },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  const shouldUpdate = this.shouldUpdate(
    existingMeta,
    incomingMeta,
    existing,
    incoming,
  );

  if (shouldUpdate) {
    // distinct types are not mergeable (like delete symbol), so just replace
    if (typeof incoming !== typeof existing) {
      return incoming;
    } else {
      return this.shouldReorder(
        existingMeta,
        incomingMeta,
        existing,
        incoming,
      )
        ? this.merge(incoming, existing)
        : this.merge(existing, incoming);
    }
  } else {
    return existing;
  }
}
```

在规范化过程中，如果 store 中已存在处理后的 Entity，就会调用 `mergeWithStore()`。

它会调用 [shouldUpdate()](#shouldupdate)、[shouldReorder()](#shouldreorder)，并可能调用 [merge()](#merge)

### static shouldUpdate(existingMeta, incomingMeta, existing, incoming): boolean {#shouldupdate}

```typescript
static shouldUpdate(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return existingMeta.fetchedAt <= incomingMeta.fetchedAt;
}
```

#### 阻止更新 {#preventing-updates}

shouldUpdate 也可以用来短路 Entity 的更新。

```typescript
import deepEqual from 'deep-equal';

class Article extends GQLEntity {
  title = '';
  content = '';
  published = false;

  static shouldUpdate(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return !deepEqual(incoming, existing);
  }
}
```

### static shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldreorder}

```typescript
static shouldReorder(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return incomingMeta.fetchedAt < existingMeta.fetchedAt;
}
```

返回 `true` 时，会调换 merge 中传入 Entity 与 store 中 Entity 的参数顺序。使用
默认的 merge 时，这会让已有 Entity 的字段覆盖传入 Entity 的字段，
而不是反过来。

#### 示例 {#example}

<TypeScriptEditor>

```typescript path="shouldReorder"
import { GQLEntity } from '@data-client/graphql';

export class LatestPriceEntity extends GQLEntity {
  updatedAt = 0;
  price = '0.0';
  symbol = '';

  static shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: { updatedAt: number },
    incoming: { updatedAt: number },
  ) {
    return incoming.updatedAt < existing.updatedAt;
  }
}
```

</TypeScriptEditor>

### static merge(existing, incoming): mergedValue {#merge}

```typescript
static merge(existing: any, incoming: any) {
  return {
    ...existing,
    ...incoming,
  };
}
```

Merge 用于处理传入的 Entity 已经存在的情况。当同一个响应中出现相同的 Entity 时，
会直接调用它。默认情况下，当 [mergeWithStore()](#mergeWithStore)
判定传入的 Entity 应与 Reactive Data Client store 中已持久化的 Entity 合并时，也会调用它。

如何通过覆盖它来[为关系型数据构建反向查找](/rest/guides/relational-data#reverse-lookups)

### static mergeMetaWithStore(existingMeta, incomingMeta, existing, incoming): meta {#mergeMetaWithStore}

```typescript
static mergeMetaWithStore(
  existingMeta: {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  },
  incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
    ? existingMeta
    : incomingMeta;
}
```

在规范化过程中，如果 store 中已存在处理后的 Entity，就会调用 `mergeMetaWithStore()`。

### static queryKey(args, queryKey, getEntity, getIndex): pk? {#queryKey}

这个方法让 `Entities` 成为 [Queryable](/rest/api/schema#queryable)——无需 endpoint 即可访问 store。

覆盖它可以自定义这一行为，或者完全禁用它。

返回 `undefined` 会禁用这一行为。

返回 `pk` 字符串则会尝试查找该 Entity 并在响应中使用。

使用时，过期策略会根据该 Entity 自身的元数据计算。

**默认**使用第一个参数在 [pk()](#pk) 和 [indexes](#indexes) 中查找

### static createIfValid(processedEntity): Entity | undefined {#createIfValid}

在反规范化 Entity 时调用。如果它被判定为“有效”，就会创建该类的
实例。

返回 `undefined` 会导致 [Invalid 过期状态](/docs/concepts/expiry-policy#expiry-status)，
就像 [Invalidate](/rest/api/Invalidate) 一样。

[`Invalid`](/docs/concepts/expiry-policy#expiry-status) 过期通常意味着 hook 会进入加载状态并尝试重新获取。

```ts
static createIfValid(props): AbstractInstanceType<this> | undefined {
  if (this.validate(props)) {
    return undefined as any;
  }
  return this.fromJS(props);
}
```

### static validate(processedEntity): errorMessage? {#validate}

在规范化和反规范化时都会运行。返回字符串表示出错（该字符串即错误消息）。

规范化期间，校验失败会导致这次获取出错。

反规范化期间，校验失败会把该结果标记为“无效”，因此
会阻塞直到获取到结果。

**默认**仅在开发模式下做一些基本的字段存在性检查。覆盖它即可
禁用或自定义。

[对字段不完整的 endpoint 使用校验](/rest/guides/partial-entities)

### static fromJS(props): Entity {#fromJS}

把 props 复制到新实例的工厂方法。请用它代替 `new MyEntity()`，
以确保默认的 props 被覆盖。

## 字段 {#fields}

### static schema: \{ [k: keyof this]: Schema } {#schema}

定义[关联 Entity](/rest/guides/relational-data) 成员，或者
Date、BigNumber 这类[字段反序列化](/rest/guides/network-transform#deserializing-fields)。

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: getPost,
args: [{ id: '123' }],
response: {post:{
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
createdAt: '2019-01-23T06:07:48.311Z',
}},
delay: 150,
},
]}>

```ts title="User" collapsed
import { GQLEntity } from '@data-client/graphql';

export class User extends GQLEntity {
  name = '';
}
```

```ts title="Post"
import { GQLEntity } from '@data-client/graphql';
import { Temporal } from 'temporal-polyfill';
import { User } from './User';

export class Post extends GQLEntity {
  author = User.fromJS({});
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  content = '';
  title = '';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
  static key = 'Post';
}
```

```tsx title="PostPage" collapsed
import { useSuspense } from '@data-client/react';
import { GQLEndpoint } from '@data-client/graphql';
import { Post } from './Post';

const gql = new GQLEndpoint('https://fakeapi.com');
export const getPost = gql.query(
  (v: { id: string }) => `query getPost($id: ID!) {
    post(id: $id) {
      id
      author
      createdAt
      content
      title
    }
  }`,
  { post: Post },
);

function PostPage() {
  const { post } = useSuspense(getPost, { id: '123' });
  return (
    <div>
      <p>
        {post.content} - <cite>{post.author.name}</cite>
      </p>
      <time>
        {post.createdAt.toLocaleString('en-US', { dateStyle: 'medium' })}
      </time>
    </div>
  );
}
render(<PostPage />);
```

</HooksPlayground>

#### 可选成员 {#optional-members}

这里引用的 Entity 中，如果在 Record 定义本身中有默认值，
则被视为“可选”的

```typescript
class User extends GQLEntity {
  friend: User | null = null; // this field is optional
  lastUpdated = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    friend: User,
    lastUpdated: Temporal.Instant.from,
  };
}
```

### static indexes?: (keyof this)[] {#indexes}

索引可以提升基于这些参数进行查找时的性能。把之后
想作为参数用来查找的字段名（例如 `slug`、`username`）
添加到这个列表中。

:::note

不要把 `id` 这样的主键添加到索引列表中，因为它已经被优化过了。

:::
