---
title: schema.Array - Datos de listas declarativos para React
vue_title: schema.Array - Datos de listas declarativos para Vue
sidebar_label: schema.Array
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# schema.Array

Crea un schema para normalizar un array de schemas. Si el valor de entrada es un [Object](./Object.md) en lugar de un `Array`,
el resultado normalizado será un `Array` con los valores del [Object](./Object.md).

_Nota: el mismo comportamiento se puede definir con la sintaxis abreviada: `[ mySchema ]`_

- `definition`: **obligatorio** Un schema singular que este array contiene _o_ un mapeo de valores de atributo a schema.
- `schemaAttribute`: _opcional_ (obligatorio si `definition` no es un schema singular) El atributo de cada entidad encontrada que define qué schema, según el mapeo de definition, se usa al normalizar.
  Puede ser un string o una función. Si se le da una función, acepta los siguientes argumentos:
  _ `value`: El valor de entrada de la entidad.
  _ `parent`: El objeto padre del array de entrada. \* `key`: La clave con la que el array de entrada aparece en el objeto padre.

:::tip

Para colecciones sin límite con claves `string`, usa [schema.Values](./Values.md)

:::

:::tip

Hazlo mutable (se pueden agregar nuevos elementos con [push](./Collection.md#push)/[unshift](./Collection.md#unshift)) con [Collections](./Collection.md)

:::

## Métodos de instancia {#instance-methods}

- `define(definition)`: Cuando se usa, la `definition` que se pasa se fusionará con la definición original pasada al constructor de `Array`. Este método suele ser útil para crear referencias circulares en el schema.

## Uso {#usage}

Para describir un array simple de un único tipo de entidad:

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

### Actualizar muchas entidades {#updating-many-entities}

Usa un Array con [Controller.set()](/docs/api/Controller#set-array) para escribir muchas entidades en una sola actualización del store,
sin un endpoint.

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

Si tus datos de entrada son un array con más de un tipo de entidad, es necesario definir un mapeo de schemas.

:::note

Si tus datos devuelven un objeto para el que no proporcionaste un mapeo, el objeto original se devolverá en el resultado y no se creará una entidad.

:::

#### schemaAttribute de tipo string {#string-schemaattribute}

<PolymorphicFeedDemo schema="schema.Array" attribute="string" />

#### schemaAttribute de tipo función {#function-schemaattribute}

Los valores devueltos deben coincidir con una clave de `definition`. Aquí mostraremos el mismo comportamiento que en el caso
'string', excepto que agregaremos una 's'.

<PolymorphicFeedDemo schema="schema.Array" attribute="function" />
