---
title: schema.Object - Datos de Object declarativos para React
vue_title: schema.Object - Datos de Object declarativos para Vue
sidebar_label: schema.Object
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

# schema.Object

Define un mapeo de objeto plano cuyos valores deben normalizarse en Entities. _Nota: el mismo comportamiento puede definirse con la sintaxis abreviada: `{ ... }`_

- `definition`: **obligatorio** Una definición de las entidades anidadas dentro de este objeto. Por defecto es un objeto vacío.
  _No_ necesitas definir ninguna clave de tu objeto aparte de las que contienen otras entidades. Todos los demás valores se copiarán a la salida normalizada.

:::tip

Los `Objects` tienen miembros conocidos estáticamente. Para Objects sin límite (claves `string` arbitrarias), usa [Values](./Values.md)

:::

#### Métodos de instancia {#instance-methods}

- `define(definition)`: Al usarlo, la `definition` pasada se fusionará con la definición original pasada al constructor de `Object`. Este método suele ser útil para crear referencias circulares en el schema.

#### Uso {#usage}

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: { users: [{ id: '123', name: 'Beth' }] },
delay: 150,
},
]}>

:::react

```tsx title="UsersPage.tsx"
import { Entity, RestEndpoint, schema } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

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

:::

:::vue

```ts title="api/User"
import { Entity, RestEndpoint, schema } from '@data-client/rest';

class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Object({ users: new schema.Array(User) }),
});
```

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUsers } from './api/User';

  const data = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in data.users" :key="user.pk()">{{ user.name }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>
