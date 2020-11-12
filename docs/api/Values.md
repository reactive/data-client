---
title: Values
---

Like [Array](./Array), `Values` are unbounded in size. The definition here describes the types of values to expect,
with keys being any string.

Describes a map whose values follow the given schema.

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Values` constructor. This method tends to be useful for creating circular references in schema.

## Usage

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```js
const data = { firstThing: { id: 1 }, secondThing: { id: 2 } };

class Item extends Entity {
  readonly id: number = 0;
  pk() { return `${this.id}` };
}
const valuesSchema = new schema.Values(Item);

const normalizedData = normalize(data, valuesSchema);
```

<!--Javascript-->
```js
const data = { firstThing: { id: 1 }, secondThing: { id: 2 } };

class Item extends Entity {
  pk() { return this.id };
}
const valuesSchema = new schema.Values(Item);

const normalizedData = normalize(data, valuesSchema);
```
<!--END_DOCUSAURUS_CODE_TABS-->

#### Output

```js
{
  entities: {
    Item: { '1': { id: 1 }, '2': { id: 2 } }
  },
  result: { firstThing: 1, secondThing: 2 }
}
```

### Dynamic entity types

If your input data is an object that has values of more than one type of entity, but their schema is not easily defined by the key, you can use a mapping of schema, much like `schema.Union` and `schema.Array`.

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

#### string schemaAttribute

```typescript
const data = {
  '1': { id: 1, type: 'admin' },
  '2': { id: 2, type: 'user' }
};

class User extends Entity {
  readonly id: number = 0;
  readonly type = 'user' as const;
  pk() { return `${this.id}`; }
}
class Admin extends Entity {
  readonly id: number = 0;
  readonly type = 'admin' as const;
  pk() { return `${this.id}`; }
}
const valuesSchema = new schema.Values(
  {
    admin: Admin,
    user: User
  },
  'type'
);

const normalizedData = normalize(data, valuesSchema);
```

#### function schemaAttribute

The return values should match a key in the `definition`. Here we'll show the same behavior as the 'string'
case, except we'll append an 's'.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```typescript
const data = {
  '1': { id: 1, type: 'admin' },
  '2': { id: 2, type: 'user' }
};

class User extends Entity {
  readonly id: number = 0;
  readonly type = 'user' as const;
  pk() { return `${this.id}`; }
}
class Admin extends Entity {
  readonly id: number = 0;
  readonly type = 'admin' as const;
  pk() { return `${this.id}`; }
}
const valuesSchema = new schema.Values(
  {
    admins: Admin,
    users: User
  },
  (input: any, parent: unknown, key: string) => `${input.type}s`
);

const normalizedData = normalize(data, valuesSchema);
```

<!--Javascript-->
```js
const data = {
  '1': { id: 1, type: 'admin' },
  '2': { id: 2, type: 'user' }
};

class User extends Entity {
  pk() { return this.id; }
}
class Admin extends Entity {
  pk() { return this.id; }
}
const valuesSchema = new schema.Values(
  {
    admins: Admin,
    users: User
  },
  (input, parent, key) => `${input.type}s`
);

const normalizedData = normalize(data, valuesSchema);
```
<!--END_DOCUSAURUS_CODE_TABS-->

#### Output

```js
{
  entities: {
    Admin: { '1': { id: 1, type: 'admin' } },
    User: { '2': { id: 2, type: 'user' } }
  },
  result: {
    '1': { id: 1, schema: 'Admin' },
    '2': { id: 2, schema: 'User' }
  }
}
```
