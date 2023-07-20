---
title: schema.Entity
---

<head>
  <title>schema.Entity - Entity mixin</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

If you already have classes for your data-types, `schema.Entity` mixin may be for you.

<TypeScriptEditor>

```typescript {10}
import { schema } from '@data-client/rest';

export class Article {
  id = '';
  title = '';
  content = '';
  tags: string[] = [];
}

export class ArticleEntity extends schema.Entity(Article) {}
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
  createdAt = new Date(0);
}
class UserEntity extends schema.Entity(User, {
  pk: 'username',
  key: 'User',
  schema: { createdAt: Date },
}) {}
```

</TypeScriptEditor>

### pk: string | (value, parent?, key?, args?) => string | undefined = 'id'

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
class ThreadEntity extends schema.Entity(Thread, {
  pk(value) {
    return [value.forum, value.slug].join(',');
  },
}) {}
```

</TypeScriptEditor>

### key: string

Specifies the [Entity.key](./Entity.md#key)

### schema: \{[k:string]: Schema}

Specifies the [Entity.schema](./Entity.md#schema)

## Methods

`schema.Entity` has the same methods as [Entity](./Entity.md) with an improved `mergeWithStore()` lifecycle.

This method uses [shouldReorder()](#shouldReorder) to handle race conditions rather than [useIncoming()](#useIncoming),
which is better able to handle [partial field entities](../guides/partial-entities.md).

Eventually `Entity` will also be converted to use this default implementation. You can prepare for this by copying
the [mergeWithStore](#mergeWithStore) default implementation below.

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
  const useIncoming = this.useIncoming(
    existingMeta,
    incomingMeta,
    existing,
    incoming,
  );

  if (useIncoming) {
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

`mergeWithStore()` is called during normalization when a processed entity is already found in the store.

This calls [useIncoming()](#useIncoming), [shouldReorder()](#shouldOrder) and potentially [merge()](#merge)

### static useIncoming(existingMeta, incomingMeta, existing, incoming): boolean {#useIncoming}

```typescript
static useIncoming(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return true;
}
```

#### Preventing updates

useIncoming can also be used to short-circuit an entity update.

```typescript
import deepEqual from 'deep-equal';

class ArticleEntity extends schema.Entity(
  class {
    id = '';
    title = '';
    content = '';
    published = false;
  },
) {
  static useIncoming(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return !deepEqual(incoming, existing);
  }
}
```

### static shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldReorder}

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

`true` return value will reorder incoming vs in-store entity argument order in merge. With
the default merge, this will cause the fields of existing entities to override those of incoming,
rather than the other way around.

#### Example

<TypeScriptEditor>

```typescript
class LatestPriceEntity extends schema.Entity(
  class {
    id = '';
    updatedAt = 0;
    price = '0.0';
    symbol = '';
  },
) {
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

Merge is used to handle cases when an incoming entity is already found. This is called directly
when the same entity is found in one response. By default it is also called when [mergeWithStore()](#mergeWithStore)
determines the incoming entity should be merged with an entity already persisted in the Reactive Data Client store.

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

export class ArticleEntity extends schema.Entity(Article) {}
export const ArticleEntity2 = schema.Entity(Article);

const article: ArticleEntity = ArticleEntity.fromJS();
const articleFails: ArticleEntity2 = ArticleEntity2.fromJS();
const articleWorks: InstanceType<typeof ArticleEntity2> =
  ArticleEntity2.fromJS();
```

</TypeScriptEditor>
