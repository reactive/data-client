---
title: Object
---

Define a plain object mapping that has values needing to be normalized into Entities. _Note: The same behavior can be defined with shorthand syntax: `{ ... }`_

- `definition`: **required** A definition of the nested entities found within this object. Defaults to empty object.
  You _do not_ need to define any keys in your object other than those that hold other entities. All other values will be copied to the normalized output.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Object` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```typescript
// Example data response
const data = { users: [{ id: '123', name: 'Beth' }] };

class User extends Entity {
  readonly name: string = '';
  pk() {
    return this.id;
  }
}
const responseSchema = new schema.Object({ users: new schema.Array(User) });
// or shorthand
const responseSchema = { users: new schema.Array(User) };

const normalizedData = normalize(data, responseSchema);
```

<!--Javascript-->
```js
// Example data response
const data = { users: [{ id: '123', name: 'Beth' }] };

class User extends Entity {
  pk() {
    return this.id;
  }
}
const responseSchema = new schema.Object({ users: new schema.Array(User) });
// or shorthand
const responseSchema = { users: [User] };

const normalizedData = normalize(data, responseSchema);
```
<!--END_DOCUSAURUS_CODE_TABS-->

#### Output

```js
{
  entities: {
    User: { '123': { id: '123', name: 'Beth' } }
  },
  result: { User: [ '123' ] }
}
```
