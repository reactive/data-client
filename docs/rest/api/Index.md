---
title: Index
slug: Index
---

```typescript
export interface IndexInterface<S extends Schema = Schema, P = object> {
  key(params?: P): string;
  readonly schema: S;
}
```

```typescript
import { Entity } from '@rest-hooks/normalizr';
import { Index } from '@rest-hooks/endpoint';

class User extends Entity {
  readonly id: string = '';
  readonly username: string = '';

  pk() { return this.id;}
  static indexes = ['username'] as const;
}

const UserIndex = new Index(User)

const bob = useCache(UserIndex, { username: 'bob' });

// @ts-expect-error Indexes don't fetch, they just retrieve already existing data
const bob = useSuspense(UserIndex, { username: 'bob' });
```
