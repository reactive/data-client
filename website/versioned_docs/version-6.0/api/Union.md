---
title: Union
---
import LanguageTabs from '@site/src/components/LanguageTabs';

Describe a schema which is a union of multiple schemas. This is useful if you need the polymorphic behavior provided by `schema.Array` or `schema.Values` but for non-collection fields.

- `definition`: **required** An object mapping the definition of the nested entities found within the input array
- `schemaAttribute`: **required** The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Union` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

<LanguageTabs>

```typescript
const data = { owner: { id: 1, type: 'user', name: 'Anne' } };

class User extends Entity {
  readonly id: number = 0;
  readonly type = 'user' as const;
  readonly name: string = '';
  pk() { return `${this.id}`; }
}
class Group extends Entity {
  readonly id: number = 0;
  readonly type = 'admin' as const;
  pk() { return `${this.id}`; }
}
const unionSchema = new schema.Union(
  {
    user: User,
    group: Group
  },
  'type'
);

const normalizedData = normalize(data, { owner: unionSchema });
```

```js
const data = { owner: { id: 1, type: 'user', name: 'Anne' } };

class User extends Entity {
  pk() { return `${this.id}`; }
}
class Group extends Entity {
  pk() { return `${this.id}`; }
}
const unionSchema = new schema.Union(
  {
    user: User,
    group: Group
  },
  'type'
);

const normalizedData = normalize(data, { owner: unionSchema });
```
</LanguageTabs>

#### Output

```js
{
  entities: {
    User: { '1': { id: 1, type: 'user', name: 'Anne' } }
  },
  result: { owner: { id: 1, schema: 'User' } }
}
```

