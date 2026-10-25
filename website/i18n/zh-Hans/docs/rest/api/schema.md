---
title: 用 Schema 思考
sidebar_label: Schema
description: 声明式的 TypeScript 数据定义。无需状态管理代码即可构建可变的动态数据应用。
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import SchemaTable from '../../core/shared/\_schema_table.mdx';

设想一篇典型的博客文章。单篇文章的 API 响应可能如下所示：

```json
{
  "id": "123",
  "author": {
    "id": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": [
    {
      "id": "324",
      "createdAt": "2013-05-29T00:00:00-04:00",
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    },
    {
      "id": "544",
      "createdAt": "2013-05-30T00:00:00-04:00",
      "commenter": {
        "id": "1",
        "name": "Paul"
      }
    }
  ]
}
```

## 声明式定义 {#declarative-definitions}

我们的 `article` 中嵌套了两种 [Entity](./Entity.md) 类型：`users` 和 `comments`。借助各种 [schema](./Entity.md#schema)，我们可以把这三种 Entity 类型全部规范化：

<LanguageTabs>

```typescript
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from 'temporal-polyfill';

class User extends Entity {
  id = '';
  name = '';
}

class Comment extends Entity {
  id = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  commenter = User.fromJS();

  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

class Article extends Entity {
  id = '';
  title = '';
  author = User.fromJS();
  comments: Comment[] = [];

  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

```javascript
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from 'temporal-polyfill';

class User extends Entity { }

class Comment extends Entity {
  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

class Article extends Entity {
  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

</LanguageTabs>

## 规范化 {#normalize}

```js
import { normalize } from '@data-client/normalizr';

const args = [{ id: '123' }];
const normalizedData = normalize(Article, originalData, args);
```

现在，`normalizedData` 会为所有 Entity 创建一个可序列化的单一事实来源：

```js
{
  result: "123",
  entities: {
    articles: {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: [ "324", "544" ]
      }
    },
    users: {
      "1": { "id": "1", "name": "Paul" },
      "2": { "id": "2", "name": "Nicole" }
    },
    comments: {
      "324": {
        id: "324",
        createdAt: "2013-05-29T00:00:00-04:00",
        commenter: "2"
      },
      "544": {
        id: "544",
        createdAt: "2013-05-30T00:00:00-04:00",
        commenter: "1"
      }
    }
  },
  // contents excluded for brevity
  indexes,
  entitiesMeta,
}
```

## 反规范化 {#denormalize}

```js
import { denormalize } from '@data-client/normalizr';

const denormalizedData = denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
```

现在，`denormalizedData` 会实例化这些类，确保同一成员（例如 `Paul`）的所有实例在引用上相等：

```js
Article {
  id: '123',
  title: 'My awesome blog post',
  author: User { id: '1', name: 'Paul' },
  comments: [
    Comment {
      id: '324',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '2', name: 'Nicole' }]
    },
    Comment {
      id: '544',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '1', name: 'Paul' }]
    }
  ]
}
```

### MemoCache {#memocache}

`MemoCache` 是一个单例，可用于在多次调用之间保持引用相等，同时
还可能把性能提升 2000%。它的方法都经过了记忆化。

#### memo.denormalize {#memodenormalize}

```js
import { MemoCache } from '@data-client/normalizr';

// you can construct a new memo anytime you want to reset the cache
const memo = new MemoCache();

const { data, paths } = memo.denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
const { data: data2 } = memo.denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);

// referential equality maintained between calls
assert(data === data2);
```

`memo.denormalize()` 与上面的 [denormalize()](#denormalize) 完全一样，只是返回值中还包含 `paths`。`paths`
是一个数组，包含结果中所有 Entity 的路径。

#### memo.query {#memoquery}

`memo.query()` 允许仅根据参数（而不是规范化后的输入）对 [Queryable](#queryable) 进行反规范化。

```ts
const data = memo.query(
  Article,
  args,
  normalizedData,
);
```

## Queryable {#queryable}

`Queryable` Schema 无需 endpoint 即可访问 store。它们通过
[queryKey](./Entity.md#queryKey) 方法实现这一点，该方法会生成通常存储在 endpoint 缓存中的结果。

这使它们可以用于以下额外场景：

- [useQuery()](/docs/api/useQuery) - 在 :react[React]:vue[Vue] 中渲染
- [schema.Query()](./Query.md) - 作为输入，生成经过记忆化的计算结果。
- [ctrl.get](/docs/api/Controller#get)/[snap.get](/docs/api/Snapshot#get)
  - [Managers](/docs/concepts/managers)
  - 在 :react[React]:vue[Vue] 中通过 [useController()](/docs/api/useController)
  - [RestEndpoint.getOptimisticResponse](./RestEndpoint.md#getoptimisticresponse)
  - :react[使用 [renderDataHook()](/docs/api/renderDataHook) 进行 [hook 的单元测试](/docs/guides/unit-testing-hooks)]:vue[使用 `renderDataCompose()` 进行 [composable 的单元测试](/docs/guides/unit-testing-composables)]
- [memo.query()](#memoquery)
- 在 endpoint 解析之前就进行渲染，从而提升 [useSuspense](/docs/api/useSuspense)、[useDLE](/docs/api/useDLE) 的性能

`Querables` 包括 [Entity](./Entity.md)、[All](./All.md)、[Collection](./Collection.md)、[Query](./Query.md)、
[Union](./Union.md) 和 [Scalar](./Scalar.md)。[Lazy](./Lazy.md) 字段可以通过其 [`.query`](./Lazy.md#query) 访问器得到一个 Queryable。

```ts
interface Queryable {
  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    getEntity: GetEntity,
    getIndex: GetIndex,
    // `{}` means non-void
  ): {};
}
```

## Schema 概览 {#schema-overview}

<SchemaTable/>
