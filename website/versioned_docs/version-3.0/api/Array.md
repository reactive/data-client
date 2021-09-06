---
title: Array
---

Creates a schema to normalize an array of schemas. If the input value is an `Object` instead of an `Array`,
the normalized result will be an `Array` of the `Object`'s values.

_Note: The same behavior can be defined with shorthand syntax: `[ mySchema ]`_

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  _ `value`: The input value of the entity.
  _ `parent`: The parent object of the input array. \* `key`: The key at which the input array appears on the parent object.

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Array` constructor. This method tends to be useful for creating circular references in schema.

## Usage

To describe a simple array of a singular entity type:

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->

```typescript
const data = [
  { id: '123', name: 'Jim' },
  { id: '456', name: 'Jane' },
];
class User extends Entity {
  readonly name: string = '';
  pk() {
    return this.id;
  }
}

const userListSchema = new schema.Array(User);
// or use shorthand syntax:
const userListSchema = [User];

const normalizedData = normalize(data, userListSchema);
```

<!--Javascript-->

```js
const data = [
  { id: '123', name: 'Jim' },
  { id: '456', name: 'Jane' },
];
class User extends Entity {
  pk() {
    return this.id;
  }
}

const userListSchema = new schema.Array(User);
// or use shorthand syntax:
const userListSchema = [User];

const normalizedData = normalize(data, userListSchema);
```

<!--END_DOCUSAURUS_CODE_TABS-->

#### Output

```js
{
  entities: {
    User: {
      '123': { id: '123', name: 'Jim' },
      '456': { id: '456', name: 'Jane' }
    }
  },
  result: [ '123', '456' ]
}
```

### Dynamic entity types

If your input data is an array of more than one type of entity, it is necessary to define a schema mapping.

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

#### string schemaAttribute

```typescript
const data = [
  { id: 1, type: 'admin' },
  { id: 2, type: 'user' },
];

class User extends Entity {
  readonly type = 'user' as const;
  pk() {
    return this.id;
  }
}
class Admin extends Entity {
  readonly type = 'admin' as const;
  pk() {
    return this.id;
  }
}
const myArray = new schema.Array(
  {
    admin: Admin,
    user: User,
  },
  'type'
);

const normalizedData = normalize(data, myArray);
```

#### function schemaAttribute

The return values should match a key in the `definition`. Here we'll show the same behavior as the 'string'
case, except we'll append an 's'.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->

```typescript
const data = [
  { id: 1, type: 'admin' },
  { id: 2, type: 'user' },
];

class User extends Entity {
  readonly type = 'user' as const;
  pk() {
    return this.id;
  }
}
class Admin extends Entity {
  readonly type = 'admin' as const;
  pk() {
    return this.id;
  }
}
const myArray = new schema.Array(
  {
    admins: Admin,
    users: User,
  },
  (input, parent, key) => `${input.type}s`,
);

const normalizedData = normalize(data, myArray);
```

<!--Javascript-->

```js
const data = [{ id: 1, type: 'admin' }, { id: 2, type: 'user' }];

class User extends Entity {
  pk() {
    return this.id;
  }
}
class Admin extends Entity {
  pk() {
    return this.id;
  }
}
const myArray = new schema.Array(
  {
    admins: Admin,
    users: User,
  },
  (input, parent, key) => `${input.type}s`,
);

const normalizedData = normalize(data, myArray);
```

<!--END_DOCUSAURUS_CODE_TABS-->

#### Output

```js
{
  entities: {
    Admin: { '1': { id: 1, type: 'admin' } },
    User: { '2': { id: 2, type: 'user' } }
  },
  result: [
    { id: 1, schema: 'Admin' },
    { id: 2, schema: 'User' }
  ]
}
```
