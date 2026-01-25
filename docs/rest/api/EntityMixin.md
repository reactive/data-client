---
title: EntityMixin - Declarative unique objects for pre-existing classes
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

`Entity` defines a single _unique_ object.

If you already have classes for your data-types, `EntityMixin` may be for you.

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

## Options

The second argument to the mixin can be used to conveniently customize construction. If not specified the `Base`
class' static members will be used. Alternatively, just like with [Entity](./Entity.md), you can always specify
these as static members of the final class.

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

Specifies the [Entity.pk](./Entity.md#pk)

A `string` indicates the field to use for pk.

A `function` is used just like [Entity.pk](./Entity.md#pk), but the first argument (`value`) is `this`

Defaults to 'id'; which means pk is a required option _unless_ the `Base` class has a serializable `id` member.

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

### key: string  {#key}

Specifies the [Entity.key](./Entity.md#key)

### schema: \{[k\:string]: Schema}  {#schema}

Specifies the [Entity.schema](./Entity.md#schema)


## const vs class

If you don't need to further customize the entity, you can use a `const` declaration instead
of `extend` to another class.

There is a subtle difference when referring to the `class token` in TypeScript - as
`class` declarations will refer to the instance type; whereas `const tokens` refer to the value, so you
must use `typeof`, but additionally typeof gives the class type, so you must layer `InstanceType`
on top.

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


## Lifecycle

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

To override lifecycle methods like [process()](#process), you must use the `class ... extends EntityMixin(...) {}` form.
The `EntityMixin()` options only include [pk](#pk), [key](#key), and [schema](#schema)—lifecycle overrides live on the class itself.

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
