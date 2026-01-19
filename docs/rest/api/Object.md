---
title: schema.Object - Declarative Object data for React
sidebar_label: schema.Object
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';

# schema.Object

Define a plain object mapping that has values needing to be normalized into Entities. _Note: The same behavior can be defined with shorthand syntax: `{ ... }`_

- `definition`: **required** A definition of the nested entities found within this object. Defaults to empty object.
  You _do not_ need to define any keys in your object other than those that hold other entities. All other values will be copied to the normalized output.

:::tip

`Objects` have statically known members. For unbounded Objects (arbitrary `string` keys), use [Values](./Values.md)

:::

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Object` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: { users: [{ id: '123', name: 'Beth' }] },
delay: 150,
},
]}>

```tsx title="UsersPage.tsx"
class User extends Entity {
  id = '';
  name = '';
}
const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Object({ users: new schema.Array(User) }),
});
function UsersPage() {
  const { users } = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>
