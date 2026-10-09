---
title: Entity e normalização de dados
sidebar_label: Normalização de dados
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import Link from '@docusaurus/Link';
import SchemaTable from '../shared/\_schema_table.mdx';

[Entities](/rest/api/Entity) têm uma chave primária. Isso permite acesso fácil por meio de uma tabela de consulta.
Assim, é simples encontrar, atualizar, criar ou excluir os mesmos dados, não importa em qual
endpoint eles foram usados.

<!--
<LanguageTabs>

```ts
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  readonly id: number = 0;
  readonly userId: number = 0;
  readonly title: string = '';
  readonly completed: boolean = false;
}
```

```js
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
}
```

</LanguageTabs>
-->

<Tabs
defaultValue="State"
values={[
{ label: 'State', value: 'State' },
{ label: 'Response', value: 'Response' },
{ label: 'Endpoint', value: 'Endpoint' },
{ label: 'Entity', value: 'Entity' },
{ label: 'Component', value: 'Component' },
]}>
<TabItem value="State">

![Cache de Entities](/img/entities.png 'Cache de Entities')

</TabItem>
<TabItem value="Response">

```json
[
  { "id": 1, "title": "this is an entity" },
  { "id": 2, "title": "this is the second entity" }
]
```

</TabItem>
<TabItem value="Endpoint">

```typescript
const getPresentations = new Endpoint(
  () => fetch(`/presentations`).then(res => res.json()),
  { schema: new Collection([Presentation]) },
);
```

</TabItem>
<TabItem value="Entity">

```typescript
class Presentation extends Entity {
  id = '';
  title = '';

  static key = 'Presentation';
}
```

</TabItem>
<TabItem value="Component">

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { getPresentations } from './api/Presentation';

export function PresentationsPage() {
  const presentation = useSuspense(getPresentations);
  return presentation.map(presentation => (
    <div key={presentation.pk()}>{presentation.title}</div>
  ));
}
```

:::

:::vue

```html title="PresentationsPage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getPresentations } from './api/Presentation';

  const presentations = await useSuspense(getPresentations);
</script>

<template>
  <div v-for="presentation in presentations" :key="presentation.pk()">
    {{ presentation.title }}
  </div>
</template>
```

:::

</TabItem>
</Tabs>

Extrair entities de uma resposta é conhecido como normalização (`normalization`). Acessar uma resposta reverte
o processo por meio da desnormalização (`denormalization`).

:::info[Igualdade referencial global]

Usar entities estende a garantia de igualdade referencial global do Reactive Data Client para além da granularidade de
uma resposta inteira de endpoint.

:::

## Mutações e dados dinâmicos {#mutations-and-dynamic-data}

Quando um endpoint altera dados, isso é conhecido como [efeito colateral](/rest/guides/side-effects). Marcar um endpoint com [sideEffect: true](/rest/api/Endpoint#sideeffect)
informa ao Reactive Data Client que esse endpoint não é idempotente e, portanto, não deve ser permitido em hooks
que podem chamar o endpoint um número arbitrário de vezes, como [useSuspense()](../api/useSuspense.md) ou [useFetch()](../api/useFetch.md)

Ao incluir os dados alterados na resposta do endpoint, o Reactive Data Client consegue atualizar
quaisquer entities que extrai por meio do schema especificado.

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

```typescript
import { RestEndpoint, schema } from '@data-client/rest';

const todoCreate = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  method: 'POST',
  schema: new Collection([Todo]).push,
});
```

<details>
<summary><b>Exemplo de uso</b></summary>

:::react

```tsx
import { useController } from '@data-client/react';
import { todoCreate } from './api/Todo';
import Form from './Form';
import FormField from './FormField';

export default function NewTodoForm() {
  const ctrl = useController();
  return (
    <Form
      onSubmit={e => ctrl.fetch(todoCreate, new FormData(e.target))}
    >
      <FormField name="title" />
    </Form>
  );
}
```

:::

:::vue

```html title="NewTodoForm.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { todoCreate } from './api/Todo';
  import Form from './Form.vue';
  import FormField from './FormField.vue';

  const ctrl = useController();
  const handleSubmit = (e: Event) =>
    ctrl.fetch(todoCreate, new FormData(e.target as HTMLFormElement));
</script>

<template>
  <Form @submit="handleSubmit">
    <FormField name="title" />
  </Form>
</template>
```

:::

</details>

</TabItem>
<TabItem value="Update">

```typescript
import { RestEndpoint } from '@data-client/rest';

const todoUpdate = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'PUT',
  schema: Todo,
});
```

<details>
<summary><b>Exemplo de uso</b></summary>

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { todoDetail, todoUpdate } from './api/Todo';
import Form from './Form';
import FormField from './FormField';

export default function UpdateTodoForm({ id }: { id: number }) {
  const todo = useSuspense(todoDetail, { id });
  const ctrl = useController();
  return (
    <Form
      onSubmit={e =>
        ctrl.fetch(todoUpdate, { id }, new FormData(e.target))
      }
      initialValues={todo}
    >
      <FormField name="title" />
    </Form>
  );
}
```

:::

:::vue

```html title="UpdateTodoForm.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { todoDetail, todoUpdate } from './api/Todo';
  import Form from './Form.vue';
  import FormField from './FormField.vue';

  const props = defineProps<{ id: number }>();
  const todo = await useSuspense(todoDetail, () => ({ id: props.id }));
  const ctrl = useController();
  const handleSubmit = (e: Event) =>
    ctrl.fetch(
      todoUpdate,
      { id: props.id },
      new FormData(e.target as HTMLFormElement),
    );
</script>

<template>
  <Form @submit="handleSubmit" :initialValues="todo">
    <FormField name="title" />
  </Form>
</template>
```

:::

</details>

</TabItem>
<TabItem value="Delete">

```typescript
import { Invalidate, RestEndpoint } from '@data-client/rest';

const todoDelete = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'DELETE',
  schema: new Invalidate(Todo),
});
```

<details>
<summary><b>Exemplo de uso</b></summary>

:::react

```tsx
import { useController } from '@data-client/react';
import { todoDelete, type Todo } from './api/Todo';

export default function TodoWithDelete({ todo }: { todo: Todo }) {
  const ctrl = useController();
  return (
    <div>
      {todo.title}
      <button onClick={() => ctrl.fetch(todoDelete, { id: todo.id })}>
        Delete
      </button>
    </div>
  );
}
```

:::

:::vue

```html title="TodoWithDelete.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { todoDelete, type Todo } from './api/Todo';

  defineProps<{ todo: Todo }>();
  const ctrl = useController();
</script>

<template>
  <div>
    {{ todo.title }}
    <button @click="ctrl.fetch(todoDelete, { id: todo.id })">Delete</button>
  </div>
</template>
```

:::

</details>

</TabItem>
</Tabs>

:::info

As mutações atualizam automaticamente o cache normalizado, resultando em dados consistentes e atualizados.

:::

## Schema {#schema}

Schemas são uma definição declarativa de como [processar respostas](/rest/api/schema)

- [onde](/rest/api/schema) esperar [Entities](/rest/api/Entity)
- Funções para [desserializar campos](/rest/guides/network-transform#deserializing-fields)

```typescript
import { RestEndpoint, Collection } from '@data-client/rest';

const getTodoList = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  // highlight-next-line
  schema: new Collection([Todo]),
});
```

Colocar nossa [Entity](/rest/api/Entity) `Todo` em uma [Collection](/rest/api/Collection) de array nos permite
[adicionar com push](/rest/api/RestEndpoint#push) ou [com unshift](/rest/api/RestEndpoint#unshift) novos `Todos` a ela com facilidade.

Além do array, há alguns outros 'schemas' disponíveis para vários padrões. Os dois primeiros (Object e Array)
têm atalhos que usam literais de objeto e de array.

<SchemaTable/>

[Saiba mais](/rest/api/schema)

### Aninhamento {#nesting}

Além disso, as próprias [Entities](/rest/api/Entity) podem especificar [schemas aninhados](/rest/guides/relational-data)
por meio de um membro [static schema](/rest/api/Entity#schema).

<Tabs
defaultValue="Entity"
values={[
{ label: 'Entity', value: 'Entity' },
{ label: 'Response', value: 'Response' },
]}>
<TabItem value="Entity">

```typescript
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  id = 0;
  user = User.fromJS();
  title = '';
  completed = false;

  static key = 'Todo';

  // highlight-start
  static schema = {
    user: User,
  };
  // highlight-end
}

class User extends Entity {
  id = 0;
  username = '';

  static key = 'User';
}
```

</TabItem>
<TabItem value="Response">

```json
{
  "id": 5,
  "user": {
    "id": 10,
    "username": "bob"
  },
  "title": "Write some Entities",
  "completed": false
}
```

</TabItem>
</Tabs>

[Saiba mais](/rest/guides/relational-data)

### Representações de dados {#data-representations}

Além disso, funções podem ser [usadas como schema](/rest/guides/network-transform#deserializing-fields). Elas serão chamadas durante a desnormalização.
Isso pode ser útil com representações como [bignumber](https://mikemcl.github.io/bignumber.js/) ou [temporal instant](https://tc39.es/proposal-temporal/docs/instant.html)

```ts
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  id = 0;
  user = User.fromJS();
  title = '';
  completed = false;
  // highlight-next-line
  dueDate = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Todo';

  static schema = {
    user: User,
    // highlight-next-line
    dueDate: Temporal.Instant.from,
  };
}
```

:::info

Graças à garantia de igualdade referencial global, a construção dos membros ocorre apenas uma vez
por atualização.

:::

## Inspeção do store (depuração) {#store-inspection-debugging}

A [extensão de navegador DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
pode ser instalada para inspecionar e [depurar o store](../getting-started/debugging.md).

![devtools do navegador](/img/devtool-state.png 'Reactive Data Client devtools')

<center>

<Link className="button button--secondary" to="../getting-started/debugging">Guia de depuração do Data Client »</Link>

</center>

## Benchmarks {#benchmarks}

A memoização em nível de Entity entrega desempenho de desnormalização até **20x** maior e propagação de mutações até **90x** mais rápida
em comparação com abordagens não normalizadas. Veja a página completa de [Desempenho](./performance.md) para
os resultados dos benchmarks de normalização, bem como benchmarks completos da integração com React.