---
title: Values Schema - Datos de mapa declarativos para React
vue_title: Values Schema - Datos de mapa declarativos para Vue
sidebar_label: Values
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# Values

Al igual que [Array](./Array), `Values` no tiene un tamaño acotado. La definición aquí describe los tipos de valores esperados,
y las claves pueden ser cualquier string.

Describe un mapa cuyos valores siguen el schema dado.

- `definition`: **obligatorio** Un único schema que contiene este array _o_ un mapeo de schema a valores de atributo.
- `schemaAttribute`: _opcional_ (obligatorio si `definition` no es un único schema) El atributo de cada entidad encontrada que define qué schema, según el mapeo de la definición, se usará al normalizar.
  Puede ser un string o una función. Si se da una función, recibe los siguientes argumentos:
  - `value`: El valor de entrada de la entidad.
  - `parent`: El objeto padre del array de entrada.
  - `key`: La clave con la que aparece el array de entrada en el objeto padre.

:::tip

Hazlo mutable (se pueden [asignar](./Collection.md#assign) nuevos elementos) con [Collections](./Collection.md)

:::

## Métodos de instancia {#instance-methods}

- `define(definition)`: Cuando se usa, la `definition` que se pasa se combinará con la definición original pasada al constructor de `Values`. Este método suele ser útil para crear referencias circulares en el schema.

:::info[Nomenclatura]

`Values` recibe su nombre de [Object.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values), ya que
sus schemas se usan para el valor de un Object.

:::

## Uso {#usage}

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/items'}),
args: [],
response: { firstThing: { id: 1 }, secondThing: { id: 2 } },
delay: 150,
},
]}>

:::react

```tsx title="ItemPage.tsx"
import { Entity, RestEndpoint, Values } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

export class Item extends Entity {
  id = 0;
}
export const getItems = new RestEndpoint({
  path: '/items',
  schema: new Values(Item),
});
function ItemPage() {
  const items = useSuspense(getItems);
  return <pre>{JSON.stringify(items, undefined, 2)}</pre>;
}
render(<ItemPage />);
```

:::

:::vue

```ts title="api/Item"
import { Entity, RestEndpoint, Values } from '@data-client/rest';

export class Item extends Entity {
  id = 0;
}
export const getItems = new RestEndpoint({
  path: '/items',
  schema: new Values(Item),
});
```

```html title="ItemPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getItems } from './api/Item';

  const items = await useSuspense(getItems);
</script>

<template>
  <pre>{{ JSON.stringify(items, undefined, 2) }}</pre>
</template>
```

:::

</FrameworkPlayground>

### Actualizar muchas entidades {#updating-many-entities}

Usa Values con [Controller.set()](/docs/api/Controller#set-array) para escribir muchas entidades en una sola actualización del store,
sin un endpoint.

```ts
ctrl.set(getItems.schema, {
  firstThing: { id: 1 },
  secondThing: { id: 2 },
});
```

### Tipos polimórficos {#polymorphic-types}

Si tus datos de entrada son un objeto con valores de más de un tipo de entidad, pero su schema no se puede definir fácilmente a partir de la clave, puedes usar un mapeo de schemas, de forma muy similar a [Union](./Union.md) y [schema.Array](./Array.md).

:::note

Si tus datos devuelven un objeto para el que no proporcionaste un mapeo, el objeto original se devolverá en el resultado y no se creará una entidad.

:::

#### schemaAttribute de tipo string {#string-schemaattribute}

<PolymorphicFeedDemo schema="Values" attribute="string" />

#### schemaAttribute de tipo función {#function-schemaattribute}

Los valores de retorno deben coincidir con una clave de la `definition`. Aquí mostraremos el mismo comportamiento que en el caso
de 'string', salvo que añadiremos una 's'.

<PolymorphicFeedDemo schema="Values" attribute="function" />
