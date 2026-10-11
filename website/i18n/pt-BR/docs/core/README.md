---
title: Apresentando o Reactive Data Client
vue_title: Apresentando o Reactive Data Client para Vue
sidebar_label: Introdução
description: Construindo aplicações dinâmicas incríveis com NextJS, Expo, React Native e mais.
vue_description: Construindo aplicações dinâmicas incríveis com Vue e mais.
slug: /
id: introduction
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import ProtocolTabs from '@site/src/components/ProtocolTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import Link from '@docusaurus/Link';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# O Reactive Data Client

O Reactive Data Client oferece [acesso](./api/useSuspense.md) e [mutação](./api/Controller.md#fetch) seguros e performáticos sobre [protocolos de dados remotos](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/).
Tanto pull/fetch ([REST](/rest) e [GraphQL](/graphql)) quanto push/stream ([WebSockets ou Server Sent Events](./concepts/managers.md#data-stream)) podem ser usados simultaneamente.

Seus objetivos são semelhantes
aos dos [bancos de dados relacionais](https://en.wikipedia.org/wiki/Relational_database),
mas voltados a clientes de aplicações interativas. Por isso, **se o seu backend usa um [RDBMS](https://en.wikipedia.org/wiki/Relational_database) como [Postgres](https://www.postgresql.org/)
ou [MySQL](https://www.mysql.com/), esse é um bom indício de que o Reactive Data Client pode ser para você**. Da mesma forma,
assim como alguém pode escolher [arquivos simples](https://www.techopedia.com/definition/25956/flat-file) em vez de armazenamento em banco de dados,
às vezes uma biblioteca cliente menos poderosa é suficiente.

Não é uma tarefa pequena. Para alcançá-la, o design do Reactive Data Client busca **tratar dados remotos como se fossem
locais**. Isso significa que a lógica dos componentes não deve ser mais complexa do que useState e setState.

## Define API {#endpoint}

[Endpoints](./getting-started/resource.md) são os _métodos_ dos seus dados. Em sua essência,
são simplesmente funções assíncronas. No entanto, eles também definem qualquer outra coisa relevante para a [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/),
como [política de expiração](./concepts/expiry-policy.md), [modelo de dados](./concepts/normalization.md), [validação](./concepts/validation.md) e [tipos](/rest/api/RestEndpoint#typing).

<ThemedImage
alt="Endpoints usados em muitos contextos"
sources={{
    light: useBaseUrl('/img/endpoint-many.png'),
    dark: useBaseUrl('/img/endpoint-many.dark.png'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>

Ao _desacoplar_ as definições de endpoints do seu uso, conseguimos reutilizá-los em muitos contextos.

- A reutilização fácil em diferentes **componentes** facilita a colocalização das dependências de dados
- A reutilização com diferentes **:react[[hooks](./api/useSuspense.md)]:vue[[composables](./api/useSuspense.md)]** e **[ações imperativas](./api/Controller.md)** permite comportamentos diferentes com o mesmo endpoint
- A reutilização entre diferentes **[plataformas](./getting-started/installation.md)** :react[como React Native, React web ou até além do React, em Angular, Svelte, Vue ou Node]:vue[como Vue web ou até além do Vue, em React, Angular, Svelte ou Node]
- Publicados como **pacotes**, independentes de seu consumo

Endpoints são extensíveis e componíveis, com implementações de protocolos ([REST](/rest), [GraphQL](/graphql), [Websockets+SSE](./concepts/managers.md#data-stream):react[, [Img/binário](./guides/img-media.md)])
para começar rapidamente, estender e compartilhar padrões comuns.

<ProtocolTabs>

```ts
import { RestEndpoint } from '@data-client/rest';

const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
});
```

```ts
import { GQLEndpoint } from '@data-client/graphql';

const gql = new GQLEndpoint('/');
export const getTodo = gql.query(`
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`);
```

</ProtocolTabs>

## Colocalize as dependências de dados {#co-locate-data-dependencies}

Torne seus componentes reutilizáveis vinculando os dados [onde você precisa deles](./getting-started/data-dependency.md) com o [useSuspense()](./api/useSuspense.md) de uma linha. Assim como o [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await),
[useSuspense()](./api/useSuspense.md) garante seus dados assim que retorna.

:::react

```tsx {4}
import { useSuspense } from '@data-client/react';

export default function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(getTodo, { id });

  return <div>{todo.title}</div>;
}
```

:::

:::vue

```html title="TodoDetail.vue" {6}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getTodo } from './api/Todo';

  const props = defineProps<{ id: number }>();
  const todo = await useSuspense(getTodo, () => ({ id: props.id }));
</script>

<template>
  <div>{{ todo.title }}</div>
</template>
```

:::

Chega de prop drilling ou de gerenciamento de estado externo trabalhoso. O Reactive Data Client garante igualdade referencial global,
segurança dos dados e desempenho.

:::react

A colocalização também permite que a [renderização no servidor](./guides/ssr.md) transmita HTML de forma incremental, reduzindo bastante o [TTFB](https://web.dev/ttfb/).
O [SSR do Reactive Data Client](./guides/ssr.md) hidrata automaticamente o seu store, permitindo mutações interativas imediatas com **zero** fetches
no cliente no primeiro carregamento.

:::

## Trate carregamento/erro {#handle-loadingerror}

:::react

Evite centenas de spinners de carregamento colocando [AsyncBoundary](./api/AsyncBoundary.md) ao redor de vários componentes que suspendem.

Normalmente eles são colocados em limites de navegação, como páginas, rotas ou modais, ou acima deles.

```tsx {5,8}
import { AsyncBoundary } from '@data-client/react';

function App() {
  return (
    <AsyncBoundary>
      <AnotherRoute />
      <TodoDetail id={5} />
    </AsyncBoundary>
  );
}
```

O [tratamento de fallback sem Suspense](./getting-started/data-dependency.md#stateful) também pode ser usado em certos
casos no React 16 e 17

:::

:::vue

Evite centenas de spinners de carregamento colocando o [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) nativo do Vue
ao redor de vários componentes que suspendem. Seu slot `#fallback` é renderizado enquanto qualquer descendente ainda estiver aguardando dados.
Os erros são capturados com [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

Normalmente eles são colocados em limites de navegação, como páginas, rotas ou modais, ou acima deles.

```html title="App.vue" {7-10,15,20-22}
<script setup lang="ts">
  import { onErrorCaptured, ref } from 'vue';
  import AnotherRoute from './AnotherRoute.vue';
  import TodoDetail from './TodoDetail.vue';

  const error = ref<Error | null>(null);
  onErrorCaptured(err => {
    error.value = err;
    return false;
  });
</script>

<template>
  <div v-if="error">Error: {{ error.message }}</div>
  <Suspense v-else>
    <template #default>
      <AnotherRoute />
      <TodoDetail :id="5" />
    </template>
    <template #fallback>
      <Loading />
    </template>
  </Suspense>
</template>
```

O [tratamento de fallback sem Suspense](./getting-started/data-dependency.md#stateful) também pode ser usado em certos
casos.

:::

## Mutações {#mutations}

As [mutações](./getting-started/mutations.md) apresentam outro caso de reutilização, desta vez dos nossos dados. Este caso é ainda mais crítico
porque pode levar não apenas a código inchado, mas também a problemas de integridade dos dados, tearing e travamentos gerais da aplicação.

Quando chamamos nosso método/endpoint de mutação, precisamos garantir que **todos** os usos desses dados sejam atualizados.
Caso contrário, ficamos presos à complexidade, ao desempenho ruim e aos travamentos da aplicação ao tentar
propagar em cascata a atualização de endpoints.

### Mantenha os dados consistentes e atualizados {#entities}

[Entities](./concepts/normalization.md) definem nosso modelo de dados.

Isso habilita um padrão de armazenamento [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself), que
evita o 'data tearing' e melhora o desempenho.

<ProtocolTabs>

```ts
import { Entity } from '@data-client/rest';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}
```

```ts
import { GQLEntity } from '@data-client/graphql';

export class Todo extends GQLEntity {
  userId = 0;
  title = '';
  completed = false;
}
```

</ProtocolTabs>

O método [pk()](/rest/api/Entity#pk) (chave primária) é usado para construir uma tabela de consulta. Isso é
comumente conhecido como normalização de dados. Para evitar bugs, travamentos da aplicação e problemas de desempenho,
é fundamental [escolher a estrutura de estado (normalizada) certa](https://react.dev/learn/choosing-the-state-structure).

Agora podemos vincular nossa Entity tanto ao endpoint get quanto ao endpoint update, garantindo a integridade
dos dados em tempo de execução, além das definições de TypeScript.

<ProtocolTabs>

```ts {6}
import { RestEndpoint } from '@data-client/rest';

const get = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});

const update = getTodo.extend({
  method: 'PUT',
});

export const TodoResource = { get, update };
```

```ts {14,25}
import { GQLEndpoint } from '@data-client/graphql';

const gql = new GQLEndpoint('/');

const get = gql.query(
  `query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`,
  { todo: Todo },
);

const update = gql.mutation(
  `mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }`,
  { updateTodo: Todo },
);

export const TodoResource = { get, update };
```

</ProtocolTabs>

### Avise o :react[react]:vue[Vue] para atualizar {#tell-react-to-update}

Assim como em :react[`setState()`]:vue[uma atribuição a um `ref()`], precisamos avisar o :react[React]:vue[Vue] sobre quaisquer mutações para que ele possa rerrenderizar.

O [Controller](./api/Controller.md) oferece essa funcionalidade com tipagem segura.
[Controller.fetch()](./api/Controller.md#fetch) nos permite disparar mutações.

Podemos usar [useController](./api/useController.md) para acessá-lo em componentes :react[React]:vue[Vue].

:::react

<ProtocolTabs>

```tsx
import { useController } from '@data-client/react';

function ArticleEdit({ id }: { id: number }) {
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id }, data);
  return <ArticleForm onSubmit={handleSubmit} />;
}
```

```tsx
import { useController } from '@data-client/react';

function ArticleEdit({ id }: { id: number }) {
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id, ...data });
  return <ArticleForm onSubmit={handleSubmit} />;
}
```

</ProtocolTabs>

:::

:::vue

<ProtocolTabs>

```html title="ArticleEdit.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import ArticleForm from './ArticleForm.vue';

  const props = defineProps<{ id: number }>();
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id: props.id }, data);
</script>

<template>
  <ArticleForm @submit="handleSubmit" />
</template>
```

```html title="ArticleEdit.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import ArticleForm from './ArticleForm.vue';

  const props = defineProps<{ id: number }>();
  const ctrl = useController();
  // highlight-next-line
  const handleSubmit = data =>
    ctrl.fetch(TodoResource.update, { id: props.id, ...data });
</script>

<template>
  <ArticleForm @submit="handleSubmit" />
</template>
```

</ProtocolTabs>

:::

<details>
<summary><b>Acompanhando o estado imperativo de carregamento/erro</b></summary>

[useLoading()](./api/useLoading.md) aprimora funções assíncronas acompanhando seus estados de carregamento e de erro.

:::react

```tsx
import { useController, useLoading } from '@data-client/react';

function ArticleEdit({ id }: { id: number }) {
  const ctrl = useController();
  // highlight-next-line
  const [handleSubmit, loading, error] = useLoading(
    data => ctrl.fetch(TodoResource.update, { id }, data),
    [ctrl],
  );
  return <ArticleForm onSubmit={handleSubmit} loading={loading} />;
}
```

:::

:::vue

```html title="ArticleEdit.vue"
<script setup lang="ts">
  import { useController, useLoading } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import ArticleForm from './ArticleForm.vue';

  const props = defineProps<{ id: number }>();
  const ctrl = useController();
  // highlight-next-line
  const [handleSubmit, loading, error] = useLoading(data =>
    ctrl.fetch(TodoResource.update, { id: props.id }, data),
  );
</script>

<template>
  <ArticleForm @submit="handleSubmit" :loading="loading" />
</template>
```

:::

</details>

### Mais modelagem de dados {#more-data-modeling}

E se a nossa entity não for o item de nível superior? Aqui definimos o endpoint `getList`
com [new Collection([Todo])](/rest/api/Collection) como seu schema. Os [Schemas](./concepts/normalization.md#schema) dizem ao Reactive Data Client _onde_ encontrar
as Entities. Ao colocá-la dentro de uma lista, o Reactive Data Client sabe que deve esperar uma resposta
em que cada item da lista é a entity especificada.

```typescript {6}
import { RestEndpoint, Collection } from '@data-client/rest';

// get and update definitions omitted

const getList = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  schema: new Collection([Todo]),
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
});

export default (TodoResource = { getList, get, update });
```

Os [Schemas](./concepts/normalization.md) também inferem e impõem automaticamente o tipo da resposta, garantindo
que a variável `todos` seja tipada com precisão.

:::react

```tsx {4}
import { useSuspense } from '@data-client/react';

export default function TodoList() {
  const todos = useSuspense(TodoResource.getList);

  return (
    <div>
      {todos.map(todo => (
        <TodoListItem key={todo.pk()} todo={todo} />
      ))}
    </div>
  );
}
```

:::

:::vue

```html title="TodoList.vue" {6}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import TodoListItem from './TodoListItem.vue';

  const todos = await useSuspense(TodoResource.getList);
</script>

<template>
  <div>
    <TodoListItem v-for="todo in todos" :key="todo.pk()" :todo="todo" />
  </div>
</template>
```

:::

Agora usamos nosso modelo de dados em três casos: `TodoResource.get`, `TodoResource.getList` e `TodoResource.update`. A consistência dos dados
(assim como a igualdade referencial) será garantida entre os endpoints, mesmo depois que ocorrerem mutações.

### Organizando Endpoints {#organizing-endpoints}

Neste ponto, definimos `TodoResource.get`, `TodoResource.getList` e `TodoResource.update`. Você pode ter notado
que essas definições de endpoints compartilham alguma lógica e informação. Por isso, o Reactive Data Client
incentiva extrair a lógica compartilhada entre endpoints.

[Resources](/rest/api/resource) são coleções de endpoints que operam sobre os mesmos dados.

```typescript
import { Entity, resource } from '@data-client/rest';

class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}

const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
});
```

[Introdução ao Resource](./getting-started/resource.md)

<details>
<summary><b>Endpoints de Resource</b></summary>

:::react

```typescript
// read
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = useSuspense(TodoResource.get, { id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todos = useSuspense(TodoResource.getList);

// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todos = useSuspense(TodoResource.getList, { userId: 1 });

// mutate
const ctrl = useController();

// GET https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.getPage, { userId: 1, page: 2 });

// POST https://jsonplaceholder.typicode.com/todos
ctrl.fetch(TodoResource.getList.push, { title: 'my todo' });

// POST https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.push, { userId: 1 }, { title: 'my todo' });

// PUT https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.update, { id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.partialUpdate, { id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.delete, { id: 5 });
```

:::

:::vue

```typescript
// read
// GET https://jsonplaceholder.typicode.com/todos/5
const todo = await useSuspense(TodoResource.get, { id: 5 });

// GET https://jsonplaceholder.typicode.com/todos
const todos = await useSuspense(TodoResource.getList);

// GET https://jsonplaceholder.typicode.com/todos?userId=1
const todos = await useSuspense(TodoResource.getList, { userId: 1 });

// mutate
const ctrl = useController();

// GET https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.getPage, { userId: 1, page: 2 });

// POST https://jsonplaceholder.typicode.com/todos
ctrl.fetch(TodoResource.getList.push, { title: 'my todo' });

// POST https://jsonplaceholder.typicode.com/todos?userId=1
ctrl.fetch(TodoResource.getList.push, { userId: 1 }, { title: 'my todo' });

// PUT https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.update, { id: 5 }, { title: 'my todo' });

// PATCH https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.partialUpdate, { id: 5 }, { title: 'my todo' });

// DELETE https://jsonplaceholder.typicode.com/todos/5
ctrl.fetch(TodoResource.delete, { id: 5 });
```

:::

</details>

### Mutações sem atraso {#optimistic-updates}

:::react

[Controller.fetch](./api/Controller.md#fetch) chama o endpoint de mutação e atualiza o React com base na resposta.
Embora o [useTransition](https://react.dev/reference/react/useTransition) melhore a experiência,
a UI ainda precisa, em última instância, esperar a conclusão do fetch para atualizar.

:::

:::vue

[Controller.fetch](./api/Controller.md#fetch) chama o endpoint de mutação e atualiza o Vue com base na resposta.
A UI ainda precisa, em última instância, esperar a conclusão do fetch para atualizar.

:::

Em muitos casos, como alternar todo.completed, incrementar um upvote ou arrastar e soltar
um quadro, isso pode ser lento demais!

Opcionalmente, podemos pedir ao Reactive Data Client que execute as renderizações do :react[React]:vue[Vue] imediatamente. Para isso,
precisamos especificar _como_.

[getOptimisticResponse](/rest/guides/optimistic-updates) é como :react[[setState com uma função atualizadora](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)]:vue[uma função atualizadora]. Usando [snap](./api/Snapshot.md) para acessar o store e obter o valor
anterior, além dos argumentos do fetch, retornamos a resposta de fetch _esperada_.

```typescript
const update = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'PUT',
  schema: Todo,
  // highlight-start
  getOptimisticResponse(snap, { id }, body) {
    return {
      id,
      ...body,
    };
  },
  // highlight-end
});
```

O Reactive Data Client garante a [integridade dos dados contra qualquer possível falha de rede ou race condition](/rest/guides/optimistic-updates#optimistic-transforms), então não
se preocupe com falhas de rede, várias chamadas de mutação editando os mesmos dados ou outros problemas
comuns da programação assíncrona.

### Mutações disparadas remotamente {#remotely-triggered-mutations}

Às vezes a mudança nos dados é iniciada remotamente, seja por outros usuários do site, administradores etc. Os controles declarativos de
[política de expiração](./concepts/expiry-policy.md) permitem um controle rigoroso sobre as atualizações causadas por fetches.

No entanto, para dados que mudam com frequência (como cotações de bolsa ou conversas ao vivo), às vezes são usados protocolos
baseados em push, como Websockets ou Server Sent Events. O Reactive Data Client tem uma [poderosa camada de middleware chamada Managers](./api/Manager.md),
que pode ser usada para [iniciar atualizações de dados](./concepts/managers.md#data-stream) ao receber novos dados enviados pelo servidor.

<details>
<summary><b>StreamManager</b></summary>

```typescript framework-imports
import type { Manager, Middleware, ActionTypes } from '@data-client/react';
import { Controller, actionTypes } from '@data-client/react';
import type { EntityInterface } from '@data-client/rest';

export default class StreamManager implements Manager {
  declare protected evtSource: WebSocket | EventSource;
  declare protected entities: Record<string, EntityInterface>;

  constructor(
    evtSource: WebSocket | EventSource,
    entities: Record<string, EntityInterface>,
  ) {
    this.evtSource = evtSource;
    this.entities = entities;
  }

  middleware: Middleware = controller => {
    this.evtSource.onmessage = event => {
      try {
        const msg: { type: string; args: [any]; data: any } = JSON.parse(
          event.data,
        );
        if (msg.type in this.entities)
          controller.set(this.entities[msg.type], ...msg.args, msg.data);
      } catch (e) {
        console.error('Failed to handle message');
        console.error(e);
      }
    };
    return next => async action => next(action);
  };

  cleanup() {
    this.evtSource.close();
  }
}
```

</details>

Se não quisermos o stream de dados completo, podemos usar [useSubscription()](./api/useSubscription.md) ou [useLive()](./api/useLive.md)
para garantir que escutamos apenas os dados que nos interessam.

Endpoints com [pollFrequency](/rest/api/RestEndpoint#pollfrequency) permitem reutilizar os endpoints HTTP existentes, eliminando
a necessidade de backends adicionais de websocket ou SSE.
O polling é orquestrado globalmente pelo [SubscriptionManager](./api/SubscriptionManager.md), então, mesmo com muitos
componentes inscritos, o Reactive Data Client nunca fará fetches em excesso.

[//]: # 'TODO: ## Relational joins and nesting'

## Depuração {#debugging}

<img src={require('@site/static/img/redux-devtools-logo.jpg').default} width="75" height="75" alt="redux-devtools" style={{ float: 'left', "marginRight": "var(--ifm-paragraph-margin-bottom)" }} />

Adicione o Redux DevTools para
[extensão do Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
ou
[extensão do Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

Clique no ícone para abrir o [inspetor](./getting-started/debugging.md), que permite observar as ações despachadas,
seu efeito no estado do cache, bem como o estado atual do cache.

## Dados de mock {#mock-data}

Escrever [Fixtures](./api/Fixtures.md) é um formato padrão que pode ser usado em todos os helpers de `@data-client/test`, bem como nos seus próprios usos.

<Tabs
defaultValue="detail"
values={[
{ label: 'Detail', value: 'detail' },
{ label: 'Update', value: 'update' },
{ label: '404 error', value: 'detail404' },
{ label: 'Interceptor', value: 'interceptor' },
{ label: 'Interceptor (stateful)', value: 'interceptor-stateful' },
]}>
<TabItem value="detail">

```typescript
import type { Fixture } from '@data-client/test';
import { getTodo } from './todo';

const todoDetailFixture: Fixture = {
  endpoint: getTodo,
  args: [{ id: 5 }] as const,
  response: {
    id: 5,
    title: 'Star Reactive Data Client on Github',
    userId: 11,
    completed: false,
  },
};
```

</TabItem>
<TabItem value="update">

```typescript
import type { Fixture } from '@data-client/test';
import { updateTodo } from './todo';

const todoUpdateFixture: Fixture = {
  endpoint: updateTodo,
  args: [{ id: 5 }, { completed: true }] as const,
  response: {
    id: 5,
    title: 'Star Reactive Data Client on Github',
    userId: 11,
    completed: true,
  },
};
```

</TabItem>
<TabItem value="detail404">

```typescript
import type { Fixture } from '@data-client/test';
import { getTodo } from './todo';

const todoDetail404Fixture: Fixture = {
  endpoint: getTodo,
  args: [{ id: 9001 }] as const,
  response: { status: 404, response: 'Not found' },
  error: true,
};
```

</TabItem>
<TabItem value="interceptor">

```typescript
import type { Interceptor } from '@data-client/test';

const currentTimeInterceptor: Interceptor = {
  endpoint: new RestEndpoint({
    path: '/api/currentTime/:id',
  }),
  response({ id }) {
    return {
      id,
      updatedAt: new Date().toISOString(),
    };
  },
  delay: () => 150,
};
```

</TabItem>
<TabItem value="interceptor-stateful">

```typescript
import type { Interceptor } from '@data-client/test';

const incrementInterceptor: Interceptor = {
  endpoint: new RestEndpoint({
    path: '/api/count/increment',
    method: 'POST',
    body: undefined,
  }),
  response() {
    return {
      count: (this.count = this.count + 1),
    };
  },
  delay: () => 150,
};
```

</TabItem>
</Tabs>

- :react[[Dados de mock para o storybook](./guides/storybook.md) com [MockResolver](./api/MockResolver.md)]:vue[Dados de mock com `MockPlugin` de `@data-client/vue/test`]
- :react[[Teste hooks](./guides/unit-testing-hooks.md) com [renderDataHook()](./api/renderDataHook.md)]:vue[[Teste composables](./guides/unit-testing-composables.md) com `renderDataCompose()`]
- :react[[Teste componentes](./guides/unit-testing-components.md) com [MockResolver](./api/MockResolver.md)]:vue[[Teste componentes](./guides/unit-testing-components.md) com `mountDataClient()`] e [mockInitialState()](./api/mockInitialState.md)

## Demo {#demo}

:::react

<Tabs
defaultValue="todo"
values={[
{ label: 'Todo', value: 'todo' },
{ label: 'GitHub', value: 'github' },
{ label: 'NextJS SSR', value: 'nextjs' },
]}
groupId="Demos"

>   <TabItem value="todo">

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/todo-app?embed=1&file=src%2Fpages%2FHome%2FTodoList.tsx&hidedevtools=1&view=both&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/todo-app)
</TabItem>

  <TabItem value="github">
<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?embed=1&file=src%2Fpages%2FIssueList.tsx&hidedevtools=1&view=preview&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/github-app)
</TabItem>
<TabItem value="nextjs">

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?embed=1&file=components%2Ftodo%2FTodoList.tsx&hidedevtools=1&view=both&terminalHeight=0&showSidebar=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/nextjs)
</TabItem>
</Tabs>

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/pages/UserTodos.vue,src/resources/TodoResource.ts" view="both" />

[![Explore on GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/vue-todo-app)

:::

<div style={{ textAlign: 'center' }}>
<Link className="button button--secondary" to="/demos">Mais demos</Link>&nbsp;
<Link className="button button--secondary" to="https://skills.sh/reactive/data-client"><img src="/img/anthropic.svg" alt="Agent Skills" style={{
          height: '1em',
          verticalAlign: '-0.125em',
          display: 'inline',
        }}
/> Agent Skills</Link>
</div>
