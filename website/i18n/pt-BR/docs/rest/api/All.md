---
title: Schema All - Acesse todas as entidades na store do Reactive Data Client
sidebar_label: All
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# All

Recupera todas as entidades no cache como um Array.

- `definition`: **obrigatório** Uma [Entity](./Entity.md) singular que este array contém _ou_ um mapeamento de valores de atributo para [Entities](./Entity.md).
- `schemaAttribute`: _opcional_ (obrigatório se `definition` não for um schema singular) O atributo de cada entidade encontrada que define qual schema, conforme o mapeamento da definição, usar na normalização.
  Pode ser uma string ou uma função. Se for uma função, recebe os seguintes argumentos:
  _ `value`: O valor de entrada da entidade.
  _ `parent`: O objeto pai do array de entrada. \* `key`: A chave sob a qual o array de entrada aparece no objeto pai.

## Métodos de instância {#instance-methods}

- `define(definition)`: Quando usado, o `definition` informado será mesclado com a definição original passada ao construtor de `All`. Este método costuma ser útil para criar referências circulares no schema.

## Uso {#usage}

Para descrever um array simples de um único tipo de entidade:

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

Se os seus dados de entrada são um array com mais de um tipo de entidade, é necessário definir um mapeamento de schema.

:::note

Se os seus dados retornarem um objeto para o qual você não forneceu um mapeamento, o objeto original será retornado no resultado e nenhuma entidade será criada.

:::

#### schemaAttribute string {#string-schemaattribute}

<PolymorphicFeedDemo schema="All" attribute="string" />

#### schemaAttribute função {#function-schemaattribute}

Os valores retornados devem corresponder a uma chave em `definition`. Aqui mostraremos o mesmo comportamento do caso
'string', exceto que acrescentaremos um 's'.

<PolymorphicFeedDemo schema="All" attribute="function" />
