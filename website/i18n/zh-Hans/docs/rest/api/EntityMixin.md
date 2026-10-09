---
title: EntityMixin - 为已有类提供声明式唯一对象
sidebar_label: EntityMixin
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# EntityMixin

`Entity` 定义了单个 *唯一* 对象。

如果你已经为数据类型定义了类，`EntityMixin` 可能正适合你。

<TypeScriptEditor>

```typescript {10}
import { EntityMixin } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

export class ArticleEntity extends EntityMixin(Article) {}
```

</TypeScriptEditor>

## 选项 {#options}

mixin 的第二个参数可以方便地定制构造方式。如果未指定，将使用 `Base`
类的静态成员。另外，与 [Entity](./Entity.md) 一样，你也始终可以把
它们指定为最终类的静态成员。

<TypeScriptEditor>

```typescript
class User {
  username = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
}
class UserEntity extends EntityMixin(User, {
  pk: 'username',
  key: 'User',
  schema: { createdAt: Temporal.Instant.from },
}) {}
```

</TypeScriptEditor>

### pk: string | (value, parent?, key?, args?) => string | number | undefined = 'id' {#pk}

指定 [Entity.pk](./Entity.md#pk)

`string` 表示用作 pk 的字段。

`function` 的用法与 [Entity.pk](./Entity.md#pk) 相同，只是第一个参数（`value`）即 `this`

默认为 'id'；这意味着 pk 是必需选项，*除非* `Base` 类拥有可序列化的 `id` 成员。

<TypeScriptEditor>

```typescript title="multi-column primary key"
class Thread {
  forum = '';
  slug = '';
  content = '';
}
class ThreadEntity extends EntityMixin(Thread, {
  pk(value) {
    return [value.forum, value.slug].join(',');
  },
}) {}
```

</TypeScriptEditor>

### key: string {#key}

指定 [Entity.key](./Entity.md#key)

### schema: \{[k\:string]: Schema} {#schema}

指定 [Entity.schema](./Entity.md#schema)


## const 与 class {#const-vs-class}

如果你不需要进一步定制该 Entity，可以使用 `const` 声明，而不是
`extend` 出另一个类。

在 TypeScript 中引用 `class token` 时有一个细微差别——
`class` 声明指代的是实例类型；而 `const tokens` 指代的是值，因此你
必须使用 `typeof`，但 typeof 得到的是类的类型，所以你还必须在外面再套一层
`InstanceType`。

<TypeScriptEditor>

```typescript
import { schema } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

export class ArticleEntity extends EntityMixin(Article) {}
export const ArticleEntity2 = EntityMixin(Article);

const article: ArticleEntity = ArticleEntity.fromJS();
const articleFails: ArticleEntity2 = ArticleEntity2.fromJS();
const articleWorks: InstanceType<typeof ArticleEntity2> =
  ArticleEntity2.fromJS();
```

</TypeScriptEditor>


## 生命周期 {#lifecycle}

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

要覆盖 [process()](#process) 等生命周期方法，必须使用 `class ... extends EntityMixin(...) {}` 形式。
`EntityMixin()` 的选项只包括 [pk](#pk)、[key](#key) 和 [schema](#schema)——生命周期的覆盖要写在类本身上。

<TypeScriptEditor>

```typescript
import { EntityMixin } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

// ❌ Not supported (lifecycle methods are not EntityMixin options)
// export const ArticleEntity = EntityMixin(Article, {
//   process(input) {
//     return input;
//   },
// });

// ✅ Use a class when adding lifecycle methods
export class ArticleEntity extends EntityMixin(Article) {
  static process(input: any, parent: any, key: string | undefined, args: any[]) {
    const processed = super.process(input, parent, key, args);
    processed.tags ??= [];
    return processed;
  }
}
```

</TypeScriptEditor>

import LifecycleMethods from '../shared/\_entity_lifecycle_methods.mdx';

<LifecycleMethods entitySyntax="EntityMixin" />
