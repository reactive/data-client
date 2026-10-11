---
title: Controller - Acesso imperativo ao store com tipagem segura
sidebar_label: Controller
---

import ProviderManagers from '../shared/_provider_managers.mdx';

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import StackBlitz from '@site/src/components/StackBlitz';
import BatchSetDemo from '../shared/\_BatchSetDemo.mdx';

# Controller

`Controller` é um singleton que fornece acesso seguro ao [store flux e ao ciclo de vida](./Manager.md#control-flow) do Reactive Data Client.
`Controller` memoiza todo o acesso ao store, permitindo uma garantia global de igualdade referencial e o melhor desempenho
de renderização e de obtenção de dados.

`Controller` é fornecido:

- Aos [Managers](./Manager.md), como o primeiro argumento em [Manager.middleware](./Manager.md#middleware)
- No :react[React]:vue[Vue], com [useController()](./useController.md)
- :react[Em [testes unitários de hooks](../guides/unit-testing-hooks.md), com [renderDataHook()](./renderDataHook.md#controller)]:vue[Em [testes unitários de composables](../guides/unit-testing-composables.md), com `renderDataCompose()` de `@data-client/vue/test`]

```ts
class Controller {
  /*************** Action Dispatchers ***************/
  fetch(endpoint, ...args): ReturnType<E>;
  fetchIfStale(endpoint, ...args): ReturnType<E> | undefined;
  expireAll({ testKey }): Promise<void>;
  invalidate(endpoint, ...args): Promise<void>;
  invalidateAll({ testKey }): Promise<void>;
  resetEntireStore(): Promise<void>;
  set(queryable, ...args, value): Promise<void>;
  set([Entity], rows): Promise<void>;
  setResponse(endpoint, ...args, response): Promise<void>;
  setError(endpoint, ...args, error): Promise<void>;
  resolve(endpoint, { args, response, fetchedAt, error }): Promise<void>;
  subscribe(endpoint, ...args): Promise<void>;
  unsubscribe(endpoint, ...args): Promise<void>;
  /*************** Data Access ***************/
  get(queryable, ...args, state): Denormalized<typeof queryable>;
  getResponse(endpoint, ...args, state): { data; expiryStatus; expiresAt };
  getError(endpoint, ...args, state): ErrorTypes | undefined;
  snapshot(state: State<unknown>, fetchedAt?: number): SnapshotInterface;
  getState(): State<unknown>;
}
```

## Dispatchers de actions {#action-dispatchers}

### fetch(endpoint, ...args) {#fetch}

Faz o fetch do endpoint com os args fornecidos, atualizando o cache do Reactive Data Client com
a resposta ou o erro ao concluir.

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

:::react

```tsx
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';

function CreatePost() {
  const ctrl = useController();

  return (
    <form
      onSubmit={e =>
        ctrl.fetch(PostResource.getList.push, new FormData(e.currentTarget))
      }
    >
      {/* ... */}
    </form>
  );
}
```

:::

:::vue

```html title="CreatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { PostResource } from './PostResource';

  const ctrl = useController();

  const handleSubmit = (e: Event) =>
    ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
</script>

<template>
  <form @submit.prevent="handleSubmit"><!-- ... --></form>
</template>
```

:::

</TabItem>
<TabItem value="Update">

:::react

```tsx
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';

function UpdatePost({ id }: { id: string }) {
  const ctrl = useController();

  return (
    <form
      onSubmit={e =>
        ctrl.fetch(PostResource.update, { id }, new FormData(e.currentTarget))
      }
    >
      {/* ... */}
    </form>
  );
}
```

:::

:::vue

```html title="UpdatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { PostResource } from './PostResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const handleSubmit = (e: Event) =>
    ctrl.fetch(
      PostResource.update,
      { id: props.id },
      new FormData(e.target as HTMLFormElement),
    );
</script>

<template>
  <form @submit.prevent="handleSubmit"><!-- ... --></form>
</template>
```

:::

</TabItem>
<TabItem value="Delete">

:::react

```tsx
import { useController } from '@data-client/react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Post, PostResource } from './PostResource';

function PostListItem({ post }: { post: Post }) {
  const ctrl = useController();
  const navigate = useNavigate();

  const handleDelete = useCallback(
    async e => {
      await ctrl.fetch(PostResource.delete, { id: post.id });
      navigate('/');
    },
    [ctrl, post.id],
  );

  return (
    <div>
      <h3>{post.title}</h3>
      <button onClick={handleDelete}>X</button>
    </div>
  );
}
```

:::

:::vue

```html title="PostListItem.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { useRouter } from 'vue-router';
  import { Post, PostResource } from './PostResource';

  const props = defineProps<{ post: Post }>();
  const ctrl = useController();
  const router = useRouter();

  const handleDelete = async () => {
    await ctrl.fetch(PostResource.delete, { id: props.post.id });
    router.push('/');
  };
</script>

<template>
  <div>
    <h3>{{ post.title }}</h3>
    <button @click="handleDelete">X</button>
  </div>
</template>
```

:::

</TabItem>
</Tabs>

:::tip

`fetch` tem o mesmo valor de retorno que o [Endpoint](/rest/api/Endpoint) passado a ele.
Ao usar schemas, o valor desnormalizado é retornado

```ts
const controller = useController();

const post = await controller.fetch(
  PostResource.getList.push,
  createPayload,
);
post.title;
post.pk();
```

:::

#### Endpoint.sideEffect {#endpointsideeffect}

[sideEffect](/rest/api/Endpoint#sideeffect) altera o comportamento

##### true {#true}

- Resolve _antes_ de [confirmar (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) as atualizações de cache do Reactive Data Client. (React 16, 17)
- Cada chamada sempre causará um novo fetch.

##### false | undefined {#false--undefined}

- Resolve _depois_ de [confirmar (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) as atualizações de cache do Reactive Data Client.
- Requisições idênticas são deduplicadas globalmente, permitindo apenas uma requisição em andamento por vez.
  - Para garantir que uma _nova_ requisição seja iniciada, certifique-se de abortar quaisquer requisições em andamento.

### fetchIfStale(endpoint, ...args) {#fetchIfStale}

Faz o fetch apenas se o endpoint for considerado '[desatualizado (stale)](../concepts/expiry-policy.md#stale)'.

Isso pode ser útil ao fazer prefetch de dados, pois evita buscar em excesso dados que ainda estão atualizados.

Um [exemplo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx) com um roteador fetch-as-you-render:

```ts
{
  name: 'IssueList',
  component: lazyPage('IssuesPage'),
  title: 'issue list',
  resolveData: async (
    controller: Controller,
    { owner, repo }: { owner: string; repo: string },
    searchParams: URLSearchParams,
  ) => {
    const q = searchParams?.get('q') || 'is:issue is:open';
    // highlight-start
    await controller.fetchIfStale(IssueResource.search, {
      owner,
      repo,
      q,
    });
    // highlight-end
  },
},
```

:::react

<StackBlitz app="github-app" file="src/routing/routes.tsx" view="editor" />

:::

### expireAll(\{ testKey }) {#expireAll}

Define o [status de expiração](../concepts/expiry-policy.md) de todas as respostas que correspondem a `testKey` como [Stale](../concepts/expiry-policy.md#stale).

Isso às vezes é útil para disparar a atualização apenas dos dados exibidos no momento
quando há muitas parametrizações em cache.

:::react

```tsx
import { type Controller, useController } from '@data-client/react';
import { AccountResource, TradeResource, type Trade } from './resources';
import { Form, FormField } from './Form';

const createTradeHandler =
  (ctrl: Controller, userId: string) => async (trade: Trade) => {
    await ctrl.fetch(TradeResource.getList.push, { user: userId }, trade);
    // highlight-start
    ctrl.expireAll(AccountResource.get);
    ctrl.expireAll(AccountResource.getList);
    // highlight-end
  };

function CreateTrade({ userId }: { userId: string }) {
  const handleTrade = createTradeHandler(useController(), userId);

  return (
    <Form onSubmit={handleTrade}>
      <FormField name="ticker" />
      <FormField name="amount" type="number" />
      <FormField name="price" type="number" />
    </Form>
  );
}
```

:::

:::vue

```html title="CreateTrade.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { AccountResource, TradeResource, type Trade } from './resources';
  import TradeForm from './TradeForm.vue';

  const props = defineProps<{ userId: string }>();
  const ctrl = useController();

  const handleTrade = async (trade: Trade) => {
    await ctrl.fetch(
      TradeResource.getList.push,
      { user: props.userId },
      trade,
    );
    // highlight-start
    ctrl.expireAll(AccountResource.get);
    ctrl.expireAll(AccountResource.getList);
    // highlight-end
  };
</script>

<template>
  <TradeForm @submit="handleTrade" />
</template>
```

:::

:::tip

Para reduzir a carga, melhorar o desempenho e melhorar a consistência do estado, muitas vezes é
melhor [incluir os efeitos colaterais da mutação na resposta da mutação](/rest/guides/side-effects).

:::

### invalidate(endpoint, ...args) {#invalidate}

Força o refetch :react[e o suspense ]em [useSuspense](./useSuspense.md) com o mesmo Endpoint
e os mesmos parâmetros.:vue[ Componentes montados [continuam exibindo seus dados atuais](../concepts/expiry-policy.md#invalidate)
até que o refetch seja resolvido.]

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { ArticleResource } from './ArticleResource';

function ArticleName({ id }: { id: string }) {
  const article = useSuspense(ArticleResource.get, { id });
  const ctrl = useController();

  return (
    <div>
      <h1>{article.title}</h1>
      <button onClick={() => ctrl.invalidate(ArticleResource.get, { id })}>
        Fetch &amp; suspend
      </button>
    </div>
  );
}
```

:::

:::vue

```html title="ArticleName.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const article = await useSuspense(ArticleResource.get, () => ({
    id: props.id,
  }));
</script>

<template>
  <div>
    <h1>{{ article.title }}</h1>
    <button @click="ctrl.invalidate(ArticleResource.get, { id })">
      Refetch
    </button>
  </div>
</template>
```

:::

::::react

:::tip

Para atualizar continuando a exibir dados desatualizados - [Controller.fetch](#fetch).

:::

::::

:::tip[Invalide vários endpoints de uma vez]

Use [schema.Invalidate](/rest/api/Invalidate) para invalidar todos os endpoints que contêm uma determinada entity.

Para REST, experimente usar [Resource.delete](/rest/api/resource#delete)

```ts
// deletes MyResource(5)
// this will refetch MyResource.get({id: '5'})
// and remove it from MyResource.getList
controller.setResponse(MyResource.delete, { id: '5' }, { id: '5' });
```

:::

### invalidateAll(\{ testKey }) {#invalidateAll}

[Invalida](../concepts/expiry-policy#invalid) todas as [chaves de endpoint](/rest/api/RestEndpoint#key) que correspondem a `testKey`.

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { ArticleResource } from './ArticleResource';

function ArticleName({ id }: { id: string }) {
  const article = useSuspense(ArticleResource.get, { id });
  const ctrl = useController();

  return (
    <div>
      <h1>{article.title}</h1>
      <button onClick={() => ctrl.invalidateAll(ArticleResource.get)}>
        Fetch &amp; suspend
      </button>
    </div>
  );
}
```

:::

:::vue

```html title="ArticleName.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const article = await useSuspense(ArticleResource.get, () => ({
    id: props.id,
  }));
</script>

<template>
  <div>
    <h1>{{ article.title }}</h1>
    <button @click="ctrl.invalidateAll(ArticleResource.get)">
      Refetch
    </button>
  </div>
</template>
```

:::

::::react

:::tip

Para atualizar continuando a exibir dados desatualizados - use [Controller.expireAll](#expireAll).

:::

::::

Aqui limpamos apenas os endpoints GET que usam o domínio test.com. Isso significa que outros domínios permanecem em cache.

```ts
const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

function useLogout() {
  const ctrl = useController();
  return () => ctrl.invalidateAll({ testKey });
}
```

Geralmente também é uma boa ideia limpar o cache em um 401 (não autorizado) com o [LogoutManager](./LogoutManager.md).

<ProviderManagers imports={['LogoutManager', 'getDefaultManagers']}>

```ts
import { unAuth } from '../authentication';

const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      controller.invalidateAll({ testKey });
    },
  }),
  ...getDefaultManagers(),
];
```

</ProviderManagers>

### resetEntireStore() {#resetEntireStore}

Redefine/limpa todo o cache do Reactive Data Client. Nenhuma requisição em andamento será resolvida.

Isso normalmente é usado ao fazer logout ou ao trocar de usuário autenticado.

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { useCallback } from 'react';
import { CurrentUserResource } from './CurrentUserResource';
import { impersonateUser } from './auth';

const USER_NUMBER_ONE: string = '1111';

function UserName() {
  const user = useSuspense(CurrentUserResource.get);
  const ctrl = useController();

  const becomeAdmin = useCallback(() => {
    // Changes the current user
    impersonateUser(USER_NUMBER_ONE);
    // highlight-next-line
    ctrl.resetEntireStore();
  }, [ctrl]);
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={becomeAdmin}>Be Number One</button>
    </div>
  );
}
```

:::

:::vue

```html title="UserName.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { CurrentUserResource } from './CurrentUserResource';
  import { impersonateUser } from './auth';

  const USER_NUMBER_ONE: string = '1111';

  const user = await useSuspense(CurrentUserResource.get);
  const ctrl = useController();

  const becomeAdmin = () => {
    // Changes the current user
    impersonateUser(USER_NUMBER_ONE);
    // highlight-next-line
    ctrl.resetEntireStore();
  };
</script>

<template>
  <div>
    <h1>{{ user.name }}</h1>
    <button @click="becomeAdmin">Be Number One</button>
  </div>
</template>
```

:::

### set(queryable, ...args, value) {#set}

Atualiza qualquer [Schema](/rest/api/schema#schema-overview) [Queryable](/rest/api/schema#queryable) ou várias entities de uma vez com um schema [Array](/rest/api/Array) ou [Values](/rest/api/Values).

```ts
ctrl.set(
  Todo,
  // which Todo to update
  { id: '5' },
  // merge this data into the Todo in the store
  { id: '5', title: 'tell me friends how great Data Client is' },
);
```

O valor é tipado pelo schema: uma [Entity](/rest/api/Entity) recebe seus campos (números e strings podem ser qualquer um dos dois),
enquanto uma [Collection](/rest/api/Collection) ou [All](/rest/api/All) recebe uma lista de linhas. Uma [Query](/rest/api/Query)
recebe a entrada do schema que envolve, já que `set()` normaliza esse schema em vez de reverter `process()`.

```ts
ctrl.set(TodoResource.getList.schema, [{ id: '5', completed: true }]);
```

:::note Unions

Quando cada membro declara seu discriminador como um literal (como `readonly type = 'first'`), uma linha de
[Union](/rest/api/Union) é verificada em relação ao membro que ela seleciona, então `{ type: 'first', secondField: 1 }` é um
erro. Apenas campos declarados são aceitos, então uma chave lida por uma
função `schemaAttribute` deve ser declarada em cada membro.

:::

Funções podem ser usadas no valor quando são usados dados derivados. Isso [evita condições de corrida](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

```ts
const id = '2';
ctrl.set(Article, { id }, article => ({ id, votes: article.votes + 1 }));
```

#### set([Entity], rows) {#set-array}

Passe um schema [Array](/rest/api/Array) (`[Todo]` ou `new schema.Array(Todo)`) e uma lista de linhas para atualizar
várias entities em uma única atualização do store. Cada linha é mesclada com a entity armazenada; entities que não estão na lista não são alteradas.

```ts
ctrl.set(
  [Todo],
  [
    { id: '5', completed: true },
    { id: '6', completed: false },
  ],
);
```

As linhas são tipadas pelos campos da Entity; números e strings podem ser qualquer um dos dois, e valores de objeto, array e Date não são
verificados, já que as linhas são entrada bruta.

Para listas que misturam tipos de Entity, use uma [Union](/rest/api/Union); cada linha é armazenada de acordo com seu `type`:

```ts
const Feed = new schema.Union({ post: Post, comment: Comment }, 'type');

ctrl.set(
  [Feed],
  [
    { id: '1', type: 'post', title: 'Hello' },
    { id: '7', type: 'comment', body: 'Nice!' },
  ],
);
```

Para excluir várias entities de uma vez, use [Invalidate](/rest/api/Invalidate#batch-invalidation); as linhas só precisam dos campos
de pk:

```ts
ctrl.set([new schema.Invalidate(Todo)], [{ id: '5' }, { id: '6' }]);
```

Para excluir uma, passe o schema Invalidate e sua linha:

```ts
ctrl.set(new schema.Invalidate(Todo), { id: '5' });
```

Schemas [Values](/rest/api/Values) recebem, em vez disso, um objeto de linhas:

```ts
ctrl.set(new schema.Values(Todo), {
  '5': { id: '5', completed: true },
  '6': { id: '6', completed: false },
});
```

Schemas Array, Values e Invalidate não recebem `args` (então [Entity.pk()](/rest/api/Entity#pk) e [Entity.process()](/rest/api/Entity#process)
recebem `[]`) nem função de atualização. Linhas que compartilham uma pk são mescladas na ordem da lista, sem
[Entity.shouldReorder()](/rest/api/Entity#shouldreorder). Use isso em vez de chamar `set()` uma vez por linha, como ao
[agrupar em lote atualizações de stream de alta frequência](../concepts/managers.md#batching).

:::react

<BatchSetDemo />

:::

### setResponse(endpoint, ...args, response) {#setResponse}

Armazena `response` no cache para o [Endpoint](/rest/api/Endpoint) e os args fornecidos.

Quaisquer componentes suspensos aguardando o [Endpoint](/rest/api/Endpoint) e os args fornecidos serão resolvidos.

Se já existirem dados para o [Endpoint](/rest/api/Endpoint) e os args fornecidos, eles serão atualizados.

:::react

```tsx
import { useController } from '@data-client/react';
import { useEffect } from 'react';
import { EndpointLookup } from './EndpointLookup';

function useWebsocketUpdates(url: string) {
  const ctrl = useController();

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onmessage = event => {
      const { endpoint, args, data } = JSON.parse(event.data);
      ctrl.setResponse(EndpointLookup[endpoint], ...args, data);
    };

    return () => websocket.close();
  }, [ctrl, url]);
}
```

:::

:::vue

```ts
const ctrl = useController();
let websocket: WebSocket;

onMounted(() => {
  websocket = new WebSocket(url);

  websocket.onmessage = event =>
    ctrl.setResponse(
      EndpointLookup[event.endpoint],
      ...event.args,
      event.data,
    );
});

onUnmounted(() => websocket.close());
```

:::

Isto mostra uma prova de conceito em :react[React]:vue[Vue]; no entanto, uma [implementação de websockets com Manager](../concepts/managers.md#data-stream)
seria muito mais robusta.

### setError(endpoint, ...args, error) {#setError}

Armazena o resultado do [Endpoint](/rest/api/Endpoint) e dos args como o erro fornecido.

### resolve(endpoint, \{ args, response, fetchedAt, error }) {#resolve}

Resolve um fetch específico, armazenando a `response` no cache.

É semelhante a setResponse, exceto que dispara a resolução de um fetch em andamento.
Isso significa que a atualização otimista correspondente deixará de ser aplicada.

É usado no [NetworkManager](./NetworkManager.md) e deve ser usado ao
processar requisições de fetch.

### subscribe(endpoint, ...args) {#subscribe}

Marca uma nova subscription a um [Endpoint](/rest/api/Endpoint). Isso deve incrementar a subscription.

[useSubscription](./useSubscription.md) e [useLive](./useLive.md) chamam isso na montagem.

Isso pode ser útil para :react[hooks]:vue[composables] personalizados que façam subscribe/unsubscribe com base em outros fatores.

:::react

```tsx
import {
  useController,
  type EndpointInterface,
  type FetchFunction,
  type Schema,
} from '@data-client/react';
import { useEffect } from 'react';

function useSubscribe<
  E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>,
>(endpoint: E, ...args: readonly [...Parameters<E>]) {
  const controller = useController();
  const key = endpoint.key(...args);

  useEffect(() => {
    controller.subscribe(endpoint, ...args);
    return () => {
      controller.unsubscribe(endpoint, ...args);
    };
  }, [controller, key]);
}
```

:::

:::vue

```ts
const controller = useController();

// args can be a ref, computed or getter; this re-runs when it changes
watchEffect(onCleanup => {
  const currentArgs = toValue(args);
  controller.subscribe(endpoint, ...currentArgs);
  onCleanup(() => controller.unsubscribe(endpoint, ...currentArgs));
});
```

:::

### unsubscribe(endpoint, ...args) {#unsubscribe}

Marca o fim da subscription a um [Endpoint](/rest/api/Endpoint). Isso deve
decrementar a subscription e, se a contagem chegar a 0, novas atualizações não serão mais recebidas automaticamente.

[useSubscription](./useSubscription.md) e [useLive](./useLive.md) chamam isso na desmontagem.

## Acesso a dados {#data-access}

### get(schema, ...args, state) {#get}

Busca qualquer [Schema](/rest/api/schema#schema-overview) [Queryable](/rest/api/schema#queryable) em `state`.

#### Exemplo {#example}

Isso é usado em [useQuery](./useQuery.md) e pode ser usado em
[Managers](./Manager.md) para acessar o store com segurança.

:::react

```tsx title="useQuery.ts"
import {
  useController,
  StateContext,
  type Queryable,
  type SchemaArgs,
  type DenormalizeNullable,
} from '@data-client/react';
import { useContext } from 'react';

/** Oversimplified useQuery */
function useQuery<S extends Queryable>(
  schema: S,
  ...args: SchemaArgs<S>
): DenormalizeNullable<S> | undefined {
  const state = useContext(StateContext);
  const controller = useController();

  return controller.get(schema, ...args, state);
}
```

:::

:::vue

Em componentes, [useQuery()](./useQuery.md) mantém o resultado reativo. Em handlers de eventos, passe
[getState()](#getState) para ler o store mais recente:

```ts
const ctrl = useController();

const toggle = (id: string) => {
  const todo = ctrl.get(Todo, { id }, ctrl.getState());
  if (todo) ctrl.set(Todo, { id }, { id, completed: !todo.completed });
};
```

:::

### getResponse(endpoint, ...args, state) {#getResponse}

```ts title="returns"
{
  data: DenormalizeNullable<E['schema']>;
  expiryStatus: ExpiryStatus;
  expiresAt: number;
}
```

Obtém a resposta (globalmente estável em termos de referência) para um determinado par endpoint/args a partir do state fornecido.

#### data {#data}

Os dados da resposta desnormalizados. Garante estabilidade referencial global para todos os membros.

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status) {#expirystatus}

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

##### Valid {#valid}

- Nunca suspenderá.
- Pode fazer fetch se os dados estiverem desatualizados

##### InvalidIfStale {#invalidifstale}

- Suspenderá se os dados estiverem desatualizados.
- Pode fazer fetch se os dados estiverem desatualizados

##### Invalid {#invalid}

- Sempre suspenderá
- Sempre fará fetch

#### expiresAt {#expiresat}

Um número que representa o momento em que expira. Compare com Date.now().

#### Example {#example-1}

Isso é usado em [useCache](./useCache.md), [useSuspense](./useSuspense.md) e pode ser usado em
[Managers](./Manager.md) para buscar uma resposta com o state fornecido.

:::react

```tsx title="useCache.ts"
import {
  useController,
  StateContext,
  type EndpointInterface,
} from '@data-client/react';
import { useContext } from 'react';

/** Oversimplified useCache */
function useCache<E extends EndpointInterface>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
) {
  const state = useContext(StateContext);
  const controller = useController();
  return controller.getResponse(endpoint, ...args, state).data;
}
```

:::

:::vue

Em handlers de eventos, passe [getState()](#getState) para ler o store mais recente, como no
[exemplo de getState()](#getState).

:::

```tsx title="MyManager.ts" framework-imports
import {
  type Manager,
  type Middleware,
  actionTypes,
} from '@data-client/react';

export default class MyManager implements Manager {
  declare protected websocket: WebSocket;

  middleware: Middleware = controller => {
    return next => async action => {
      if (action.type === actionTypes.FETCH) {
        console.log('The existing response of the requested fetch');
        console.log(
          controller.getResponse(
            action.endpoint,
            ...action.args,
            controller.getState(),
          ).data,
        );
      }
      next(action);
    };
  };

  cleanup() {
    this.websocket.close();
  }
}
```

### getError(endpoint, ...args, state) {#getError}

Obtém o erro, se houver, de um determinado endpoint. Retorna undefined quando não há erros.

### snapshot(state, fetchedAt) {#snapshot}

Returns a [Snapshot](./Snapshot.md).

### getState() {#getState}

Obtém o estado interno do Reactive Data Client que _já foi [confirmado (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)_.

::::warning

Isso deve ser usado apenas em handlers de eventos ou [Managers](./Manager.md).

:::react

Usar getState() no ciclo de renderização do React pode resultar em data tearing.

:::

:::vue

Usar getState() em um `computed()` ou template não atualizará quando o store mudar. Use
[useQuery()](./useQuery.md) ou [useCache()](./useCache.md) nesses casos.

:::

::::

:::react

```tsx
import { useController } from '@data-client/react';
import { useCallback } from 'react';
import { MyResource } from './resources/MyResource';
import { redirect } from './routing';

function useUpdateHandler(id: string) {
  const controller = useController();

  return useCallback(
    async updatePayload => {
      const response = await controller.fetch(
        MyResource.update,
        { id },
        updatePayload,
      );
      // the fetch has completed, but react has not yet re-rendered
      // this lets use sequence after the next re-render
      // we're working on a better solution to this specific case
      setTimeout(() => {
        const { data: denormalized } = controller.getResponse(
          MyResource.update,
          { id },
          updatePayload,
          controller.getState(),
        );
        redirect(denormalized.getterUrl);
      }, 40);
    },
    [id],
  );
}
```

:::

:::vue

```ts
const controller = useController();

const handleShare = () => {
  // reads the latest store without making this handler reactive
  const { data: article } = controller.getResponse(
    ArticleResource.get,
    { id: props.id },
    controller.getState(),
  );
  if (article) navigator.share({ title: article.title, url: article.url });
};
```

[Mutações](#endpointsideeffect) resolvem _antes_ de o store ser atualizado, então leia o resultado delas a partir
do valor com que `fetch()` resolve, em vez de `getState()`.

:::
