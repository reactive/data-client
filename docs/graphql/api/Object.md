---
title: schema.Object
---
<head>
  <title>schema.Values - Representing Objects with known keys | Rest Hooks</title>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';

Define a plain object mapping that has values needing to be normalized into Entities. _Note: The same behavior can be defined with shorthand syntax: `{ ... }`_

- `definition`: **required** A definition of the nested entities found within this object. Defaults to empty object.
  You _do not_ need to define any keys in your object other than those that hold other entities. All other values will be copied to the normalized output.

:::tip

`Objects` have statically known members. For unbounded Objects (aribtrary `string` keys), use [schema.Values](./Values.md)

:::

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Object` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve({ users: [{ id: '123', name: 'Beth' }] });

class User extends Entity {
  readonly name: string = '';
  pk() {
    return this.id;
  }
}
const userList = new Endpoint(sampleData, {
  schema:
    new schema.Object({ users: new schema.Array(User) }),
  ,
});
function UsersPage() {
  const { users } = useSuspense(userList, {});
  return (
    <div>
      {users.map(user => <div key={user.pk()}>{user.name}</div>)}
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>
