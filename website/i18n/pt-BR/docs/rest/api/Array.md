---
title: schema.Array - Dados de lista declarativos para React
vue_title: schema.Array - Dados de lista declarativos para Vue
sidebar_label: schema.Array
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# schema.Array

Cria um schema para normalizar um array de schemas. Se o valor de entrada for um [Object](./Object.md) em vez de um `Array`,
o resultado normalizado será um `Array` com os valores do [Object](./Object.md).

_Nota: o mesmo comportamento pode ser definido com a sintaxe abreviada: `[ mySchema ]`_

- `definition`: **obrigatório** Um único schema que este array contém _ou_ um mapeamento de valores de atributo para schema.
- `schemaAttribute`: _opcional_ (obrigatório se `definition` não for um único schema) O atributo em cada entity encontrada que define qual schema, de acordo com o mapeamento da definição, usar ao normalizar.
  Pode ser uma string ou uma função. Se for uma função, recebe os seguintes argumentos:
  _ `value`: O valor de entrada da entity.
  _ `parent`: O objeto pai do array de entrada. \* `key`: A chave sob a qual o array de entrada aparece no objeto pai.

:::tip

Para coleções sem limite definido com chaves `string`, use [schema.Values](./Values.md)

:::

:::tip

Torne-o mutável (novos itens podem ser adicionados com [push](./Collection.md#push)/[unshift](./Collection.md#unshift)) com [Collections](./Collection.md)

:::

## Métodos de instância {#instance-methods}

- `define(definition)`: Quando usado, a `definition` informada será mesclada com a definição original passada ao construtor de `Array`. Este método costuma ser útil para criar referências circulares no schema.

## Uso {#usage}

Para descrever um array simples de um único tipo de entity:

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
]}>

:::react

```tsx title="Users.tsx"
import { Entity, RestEndpoint, schema } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

export class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Array(User),
});
function UsersPage() {
  const users = useSuspense(getUsers);
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

export class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Array(User),
});
```

```html title="UsersPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUsers } from './api/User';

  const users = await useSuspense(getUsers);
</script>

<template>
  <div>
    <div v-for="user in users" :key="user.pk()">{{ user.name }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Atualizando várias entities {#updating-many-entities}

Use um Array com [Controller.set()](/docs/api/Controller#set-array) para gravar várias entities em uma única atualização do store,
sem um endpoint.

```ts
ctrl.set(
  [User],
  [
    { id: '123', name: 'Jim' },
    { id: '456', name: 'Jane' },
  ],
);
```

### Tipos polimórficos {#polymorphic-types}

Se os dados de entrada forem um array com mais de um tipo de entity, é necessário definir um mapeamento de schema.

:::note

Se seus dados retornarem um objeto para o qual você não forneceu um mapeamento, o objeto original será retornado no resultado e nenhuma entity será criada.

:::

#### string schemaAttribute {#string-schemaattribute}

<PolymorphicFeedDemo schema="schema.Array" attribute="string" />

#### function schemaAttribute {#function-schemaattribute}

Os valores de retorno devem corresponder a uma chave em `definition`. Aqui mostraremos o mesmo comportamento do caso 'string',
exceto que acrescentaremos um 's'.

<PolymorphicFeedDemo schema="schema.Array" attribute="function" />
