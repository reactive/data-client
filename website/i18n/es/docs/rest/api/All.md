---
title: Schema All - Accede a todas las entities del store de Reactive Data Client
sidebar_label: All
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# All

Obtiene todas las entities de la caché como un Array.

- `definition`: **obligatorio** Una única [Entity](./Entity.md) que contiene este array _o_ una asociación de valores de atributo a [Entities](./Entity.md).
- `schemaAttribute`: _opcional_ (obligatorio si `definition` no es un schema único) El atributo de cada entity encontrada que define qué schema, según la asociación de definiciones, se usará al normalizar.
  Puede ser un string o una función. Si se le da una función, acepta los siguientes argumentos:
  _ `value`: El valor de entrada de la entity.
  _ `parent`: El objeto padre del array de entrada. \* `key`: La clave con la que el array de entrada aparece en el objeto padre.

## Métodos de instancia {#instance-methods}

- `define(definition)`: Al usarse, la `definition` recibida se combinará con la definición original pasada al constructor de `All`. Este método suele ser útil para crear referencias circulares en el schema.

## Uso {#usage}

Para describir un array simple de un único tipo de entity:

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/users', method:'POST'}),
args: [{ name: 'ABC' }],
response: { id: '777', name: 'ABC' },
delay: 150,
},
]}>

```tsx title="api/User" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
}
export const createUser = new RestEndpoint({
  path: '/users',
  schema: User,
  body: { name: '' },
  method: 'POST'
});
```

:::react

```tsx title="NewUser" collapsed
import React from 'react';
import { useController } from '@data-client/react';
import { createUser } from './api/User';

export default function NewUser() {
  const ctrl = useController();
  const handlePress = React.useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        ctrl.fetch(createUser, {name: e.currentTarget.value});
        e.currentTarget.value = '';
      }
    },
    [ctrl],
  );
  return <input onKeyPress={handlePress}/>;
}
```

```tsx title="UsersPage.tsx"
import { RestEndpoint, All } from '@data-client/rest';
import { useSuspense } from '@data-client/react';
import { User } from './api/User';
import NewUser from './NewUser';

const getUsers = new RestEndpoint({
  path: '/users',
  schema: new All(User),
});

function UsersPage() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
      <NewUser />
    </div>
  );
}
render(<UsersPage />);
```

:::

:::vue

```html title="NewUser.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { createUser } from './api/User';

  const ctrl = useController();
  const name = ref('');

  const handleEnter = () => {
    ctrl.fetch(createUser, { name: name.value });
    name.value = '';
  };
</script>

<template>
  <input v-model="name" @keyup.enter="handleEnter" />
</template>
```

```html title="UsersPage.vue"
<script lang="ts">
  import { RestEndpoint, All } from '@data-client/rest';
  import { User } from './api/User';

  const getUsers = new RestEndpoint({
    path: '/users',
    schema: new All(User),
  });
</script>

<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import NewUser from './NewUser.vue';

  const users = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
    <NewUser />
  </div>
</template>
```

:::

</FrameworkPlayground>

### Tipos polimórficos {#polymorphic-types}

Si tus datos de entrada son un array con más de un tipo de entity, es necesario definir una asociación de schemas.

:::note

Si tus datos devuelven un objeto para el que no proporcionaste una asociación, el objeto original se devolverá en el resultado y no se creará una entity.

:::

#### schemaAttribute de tipo string {#string-schemaattribute}

<PolymorphicFeedDemo schema="All" attribute="string" />

#### schemaAttribute de tipo función {#function-schemaattribute}

Los valores devueltos deben coincidir con una clave de `definition`. Aquí mostraremos el mismo comportamiento que en el caso
de 'string', salvo que añadiremos una 's' al final.

<PolymorphicFeedDemo schema="All" attribute="function" />
