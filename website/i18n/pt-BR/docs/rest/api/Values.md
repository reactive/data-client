---
title: Schema Values - Dados de mapa declarativos para React
vue_title: Schema Values - Dados de mapa declarativos para Vue
sidebar_label: Values
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import { RestEndpoint } from '@data-client/rest';

# Values

Assim como [Array](./Array), `Values` não tem tamanho limitado. A definição aqui descreve os tipos de valores esperados,
com as chaves sendo qualquer string.

Descreve um mapa cujos valores seguem o schema fornecido.

- `definition`: **obrigatório** Um schema único que este array contém _ou_ um mapeamento de schema para valores de atributo.
- `schemaAttribute`: _opcional_ (obrigatório se `definition` não for um schema único) O atributo de cada entity encontrada que define qual schema, conforme o mapeamento da definition, usar ao normalizar.
  Pode ser uma string ou uma função. Se for uma função, aceita os seguintes argumentos:
  - `value`: O valor de entrada da entity.
  - `parent`: O objeto pai do array de entrada.
  - `key`: A chave sob a qual o array de entrada aparece no objeto pai.

:::tip

Torne-o mutável (novos itens podem ser [atribuídos](./Collection.md#assign)) com [Collections](./Collection.md)

:::

## Métodos de instância {#instance-methods}

- `define(definition)`: Quando usado, a `definition` informada será mesclada com a definition original passada ao constructor de `Values`. Este método tende a ser útil para criar referências circulares no schema.

:::info[Nomenclatura]

`Values` recebeu esse nome por causa de [Object.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values), pois
seus schemas são usados para os valores de um Object.

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

### Atualizando muitas entities {#updating-many-entities}

Use Values com [Controller.set()](/docs/api/Controller#set-array) para gravar muitas entities em uma única atualização do store,
sem um endpoint.

```ts
ctrl.set(getItems.schema, {
  firstThing: { id: 1 },
  secondThing: { id: 2 },
});
```

### Tipos polimórficos {#polymorphic-types}

Se seus dados de entrada são um objeto com valores de mais de um tipo de entity, mas cujo schema não é facilmente definido pela chave, você pode usar um mapeamento de schema, de forma muito parecida com [Union](./Union.md) e [schema.Array](./Array.md).

:::note

Se seus dados retornarem um objeto para o qual você não forneceu um mapeamento, o objeto original será retornado no resultado e uma entity não será criada.

:::

#### string schemaAttribute {#string-schemaattribute}

<PolymorphicFeedDemo schema="Values" attribute="string" />

#### function schemaAttribute {#function-schemaattribute}

Os valores retornados devem corresponder a uma chave na `definition`. Aqui mostraremos o mesmo comportamento do caso 'string',
exceto que acrescentaremos um 's'.

<PolymorphicFeedDemo schema="Values" attribute="function" />
