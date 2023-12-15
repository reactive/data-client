---
title: GQLEntity
---

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

GraphQL has [one standard way](https://graphql.org/learn/global-object-identification/) of defining the [pk](/rest/api/Entity#pk), which is with an `id` field.

GQLEntity come with an `id` field automatically, which is used for the [pk](/rest/api/Entity#pk).

:::info extends

`GQLEntity` extends [Entity](/rest/api/Entity)

:::

## Usage

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
  createdAt = Temporal.Instant.fromEpochSeconds(0);

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

</TypeScriptEditor>
