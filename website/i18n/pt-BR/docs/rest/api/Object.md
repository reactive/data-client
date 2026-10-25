---
title: schema.Object - Dados de Object declarativos para React
vue_title: schema.Object - Dados de Object declarativos para Vue
sidebar_label: schema.Object
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';

# schema.Object

Define um mapeamento de objeto simples cujos valores precisam ser normalizados em Entities. _Nota: o mesmo comportamento pode ser definido com a sintaxe abreviada: `{ ... }`_

- `definition`: **obrigatório** Uma definição das entities aninhadas encontradas dentro deste objeto. O padrão é um objeto vazio.
  Você _não_ precisa definir nenhuma chave no seu objeto além daquelas que contêm outras entities. Todos os outros valores serão copiados para a saída normalizada.

:::tip

`Objects` têm membros conhecidos estaticamente. Para Objects sem limite definido (chaves `string` arbitrárias), use [Values](./Values.md)

:::

#### Métodos de instância {#instance-methods}

- `define(definition)`: Quando usado, a `definition` informada será mesclada com a definição original passada ao construtor de `Object`. Este método costuma ser útil para criar referências circulares no schema.

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
