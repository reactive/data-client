---
title: Typing REST Endpoints
id: rest-types
original_id: rest-types
---

In REST design, many operations can be performed on a given type of data.

Attaching these operations to the type via static methods allows

- A singular import for both class usage, typing, and endpoints
- Reducing code duplication by extracting common patterns into base classes

[Resource](../api/Resource) provides one such pattern, which makes getting started
fast. However, even if the pattern generally matches your API design, there
are often special operations or one-off cases where additional endpoints must
be extended or added.

## TL;DR

Here's an example of each endpoint's return typed followed by usage. For
a full explanation, continue reading below.

```typescript
import { Resource, ReadShape, MutateShape, AbstractInstanceType } from 'rest-hooks';

class MyResource extends Resource {
  static list<T extends typeof Resource>(
    this: T,
  ): ReadShape<AbstractInstanceType<T>[]> {
    return super.list();
  }

  static create<T extends typeof Resource>(
    this: T,
  ): MutateShape<AbstractInstanceType<T>> {
    return super.create();
  }

  static filteredAndPaginatedList<T extends typeof Resource>(
    this: T,
  ): MutateShape<
    { results: AbstractInstanceType<T>[]; nextPage: string }
  > {
    return super.list();
  }
}
```

```typescript
import MyResource from 'resources/MyResource';
import { useResource } from 'rest-hooks';

const items = useResource(MyResource.list(), {});
const createMy = useFetcher(MyResource.create());
const { results, nextPage } = useResource(
  MyResource.filteredAndPaginatedList(),
  { filterA: true, sortby: 'first' },
);
```
