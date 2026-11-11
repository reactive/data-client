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

`Controller` oferece acesso com tipagem segura ao [store do Reactive Data Client e ao seu ciclo de vida](./Manager.md#control-flow).
Cada store tem um único `Controller`.

`Controller` memoiza a desnormalização para garantir igualdade referencial global: dados do store que não mudam resultam no
mesmo objeto onde quer que sejam lidos. Isso mantém a renderização e as consultas rápidas.

`Controller` é fornecido:

- Aos [Managers](./Manager.md), como o primeiro argumento em [Manager.middleware](./Manager.md#middleware)
- No :react[React]:vue[Vue], com [useController()](./useController.md)
- :react[Em [testes unitários de hooks](../guides/unit-testing-hooks.md), com [renderDataHook()](./renderDataHook.md#controller)]:vue[Em [testes unitários de composables](../guides/unit-testing-composables.md), com `renderDataCompose()` de `@data-client/vue/test`]

```ts
class Controller {
  /*************** Action Dispatchers ***************/
  fetch(endpoint, ...args): ReturnType<E>;
  fetchIfStale(endpoint, ...args): Promise<Denormalize<E['schema']>>;
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
  get(queryable, ...args, state): DenormalizeNullable<typeof queryable> | undefined;
  getResponse(endpoint, ...args, state): { data; expiryStatus; expiresAt };
  getError(endpoint, ...args, state): ErrorTypes | undefined;
  snapshot(state: State<unknown>, fetchedAt?: number): SnapshotInterface;
  getState(): State<unknown>;
}
```

## Dispatchers de actions {#action-dispatchers}

### fetch(endpoint, ...args) {#fetch}

Faz o fetch do endpoint com os args fornecidos. Quando o fetch termina, a resposta ou o erro vai para o cache.

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

`fetch` tem o mesmo valor de retorno do [Endpoint](/rest/api/Endpoint) passado a ele.
Com um schema, ele retorna o valor desnormalizado.

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

[sideEffect](/rest/api/Endpoint#sideeffect) altera como `fetch()` se comporta:

##### true {#true}

- Resolve _antes_ de a atualização do cache ser [confirmada (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom).
- Cada chamada inicia um novo fetch.
- Sem await, ela é rejeitada sem tratamento, já que nenhum componente lê seu erro. Aguarde-a, ou use
  [useLoading()](./useLoading.md) para exibir o erro.

##### false | undefined {#false--undefined}

- Resolve _depois_ de a atualização do cache ser [confirmada (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom).
- Requisições idênticas são deduplicadas, então só uma fica em andamento por vez.
  - Para iniciar uma _nova_ requisição, aborte primeiro a que está em andamento.
- Seguro sem await: o erro é armazenado para os componentes que leem esse endpoint, então nunca chega aos handlers
  globais de rejeições não tratadas ([reporte-o](../concepts/managers.md#error-reporting) em vez disso). `await` ainda rejeita.

### fetchIfStale(endpoint, ...args) {#fetchIfStale}

Faz o fetch apenas quando os dados estão ausentes, [desatualizados](../concepts/expiry-policy.md#stale) ou [inválidos](../concepts/expiry-policy.md#invalid),
e sempre retorna uma Promise com o resultado do fetch mais recente. Isso evita buscar dados ainda atualizados ao fazer prefetch.

| Cache | Faz fetch | `await` retorna | Sem aguardar |
| --- | --- | --- | --- |
| Ausente, desatualizado ou inválido | Sim, como [fetch()](#fetch) | Os dados buscados, ou rejeita com o erro | O erro é armazenado; sem rejeição não tratada |
| Atualizado | Não | Os dados em cache | Nada acontece |
| O fetch mais recente falhou dentro de [errorExpiryLength](/rest/api/Endpoint#errorexpirylength) | Não | Rejeita com esse erro, como [useSuspense()](./useSuspense.md) o lança | Nada acontece |

Assim, prefetches não precisam ser aguardados nem capturados: os componentes que leem esse endpoint exibem um erro armazenado como de costume.
Falhas não aguardadas não chegam aos handlers globais de rejeições não tratadas, então reporte os erros de fetch com um
[Manager de relatório de erros](../concepts/managers.md#error-reporting). Um `.then()` encadeado no resultado cria uma nova
Promise, então termine essa cadeia com `.catch()`.

```ts
// start a secondary request without waiting for it
controller.fetchIfStale(CommentResource.getList, { issueId });
// wait for the data; rejects if that fetch fails
const issue = await controller.fetchIfStale(IssueResource.get, { id: issueId });
```

Para verificar se os dados estão em cache e atualizados sem fazer fetch, leia [getResponse()](#getResponse) de forma síncrona.

:::react

#### Em loaders de rota {#fetchIfStale-loaders}

Um loader inicia os fetches da próxima página antes que ela seja renderizada. Assim como o [useSuspense()](./useSuspense.md), a navegação só deve esperar
quando os dados em cache não podem ser renderizados: quando estão ausentes, invalidados ou desatualizados em um endpoint com
[invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale). Dados desatualizados são renderizados imediatamente e
buscados de novo. Como conseguir isso depende do que o roteador espera:

| Roteador | No loader | Nada em cache |
| --- | --- | --- |
| Muda a rota em uma [transição](https://react.dev/reference/react/startTransition), como o App Router do Next.js, React Router 7, TanStack Router ou [@anansi/router](https://www.npmjs.com/package/@anansi/router) | Inicie cada `fetchIfStale()` sem aguardá-lo, para que o roteador não tenha nada a esperar | A página atual permanece até a nova estar pronta, a menos que a nova página tenha seu próprio limite de Suspense (como um [AsyncBoundary](./AsyncBoundary.md) ou um `pendingComponent` do TanStack Router), que exibe seu fallback. O @anansi/router pula a transição ao voltar e avançar |
| Renderiza o valor retornado pelo loader, ou não muda a rota em uma transição (React Router 6 sem a flag `v7_startTransition`) | Retorne os dados em cache quando puderem ser renderizados; caso contrário, retorne `fetchIfStale()` | O roteador espera pelo fetch |

O App Router do Next.js não tem loaders: `useSuspense()` faz o fetch enquanto a página é renderizada.

```ts title="Router with transitions"
import type { Controller } from '@data-client/react';
import { CommentResource } from './resources/Comment';
import { IssueResource } from './resources/Issue';

export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { id: string } }) => {
    // not awaited: the route changes at once, and useSuspense() waits inside the transition
    ctrl.fetchIfStale(IssueResource.get, { id: params.id });
    ctrl.fetchIfStale(CommentResource.getList, { issueId: params.id });
    // React Router 6 requires a return value
    return null;
  };
```

Quando a renderização no servidor espera pelo loader, como o `prefetchSpout` do @anansi/core faz com o `resolveData` do @anansi/router,
aguarde também o fetch da primeira view para que o primeiro HTML inclua seus dados. Adicione `.catch(() => {})` (ou use
`Promise.allSettled()` para vários), para que uma falha nunca seja rejeitada sem tratamento no cliente; `useSuspense()` ainda exibe o
erro.

```ts
resolveData: async (controller: Controller, { id }: { id: string }) => {
  controller.fetchIfStale(CommentResource.getList, { issueId: id });
  await controller.fetchIfStale(IssueResource.get, { id }).catch(() => {});
},
```

```ts title="Router that renders loader data"
import { ExpiryStatus, type Controller } from '@data-client/react';
import { IssueResource } from './resources/Issue';

export const issueLoader =
  (ctrl: Controller) =>
  ({ params }: { params: { id: string } }) => {
    const args = { id: params.id };
    const { data, expiryStatus } = ctrl.getResponse(
      IssueResource.get,
      args,
      ctrl.getState(),
    );
    const fetched = ctrl.fetchIfStale(IssueResource.get, args);
    // stale data is still Valid, so it returns at once
    return expiryStatus === ExpiryStatus.Valid ? data : fetched;
  };
```

Um loader que retorna um fetch pendente permite que o roteador exiba sua própria UI de carregamento e de erro, mas segura a navegação enquanto
a requisição está em andamento. Essa contrapartida vem de esperar pelos dados do loader, seja lá o que os busque.

<StackBlitz app="github-app" file="src/routing/routes.tsx" view="editor" />

:::

### expireAll(\{ testKey }) {#expireAll}

Define o [status de expiração](../concepts/expiry-policy.md) de todas as respostas que correspondem a `testKey` como [Stale](../concepts/expiry-policy.md#stale).

Use-o para atualizar apenas os dados na tela quando o cache guarda muitos conjuntos de args.

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

Muitas vezes é melhor [incluir os efeitos colaterais da mutação na resposta da mutação](/rest/guides/side-effects). Isso
reduz a carga, melhora o desempenho e mantém o estado consistente.

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

::::vue

:::tip[Exibir o fallback do Suspense novamente]

Remonte o componente com um novo `key` após invalidar; a nova instância suspende nos dados inválidos.
`timeout="0"` faz o `<Suspense>` exibir seu fallback enquanto espera, em vez do conteúdo antigo. Remontar
redefine o estado local do componente.

```html title="ArticlePage.vue"
<script setup lang="ts">
  import { ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';
  import ArticleName from './ArticleName.vue';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const remountKey = ref(0);

  async function reload() {
    await ctrl.invalidate(ArticleResource.get, { id: props.id });
    remountKey.value++;
  }
</script>

<template>
  <button @click="reload">Reload</button>
  <Suspense timeout="0">
    <ArticleName :key="remountKey" :id="id" />
    <template #fallback><Loading /></template>
  </Suspense>
</template>
```

:::

::::

::::react

:::tip

Para atualizar enquanto ainda exibe dados desatualizados, use [Controller.fetch](#fetch).

:::

::::

:::tip[Invalide vários endpoints de uma vez]

Use [schema.Invalidate](/rest/api/Invalidate) para invalidar todos os endpoints que contêm uma determinada entity.

Para REST, experimente [Resource.delete](/rest/api/resource#delete).

```ts
// deletes MyResource(5)
// this will refetch MyResource.get({id: '5'})
// and remove it from MyResource.getList
controller.setResponse(MyResource.delete, { id: '5' }, { id: '5' });
```

:::

### invalidateAll(\{ testKey }) {#invalidateAll}

[Invalida](../concepts/expiry-policy.md#invalid) todas as [chaves de endpoint](/rest/api/RestEndpoint#key) que correspondem a `testKey`.

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

Para atualizar enquanto ainda exibe dados desatualizados, use [Controller.expireAll](#expireAll) em vez disso.

:::

::::

O código abaixo invalida apenas os endpoints GET do domínio test.com. Outros domínios permanecem no cache.

```ts
const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

function useLogout() {
  const ctrl = useController();
  return () => ctrl.invalidateAll({ testKey });
}
```

Limpe também o cache em um 401 (não autorizado) com o [LogoutManager](./LogoutManager.md).

<ProviderManagers imports={['LogoutManager', 'getDefaultManagers']}>

```ts
import { unAuth } from '../authentication';

const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = () => [
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

Limpa todo o cache do Reactive Data Client. As respostas de fetches em andamento não são armazenadas. Esses fetches são rejeitados com um `ResetError` (`error.name === 'ResetError'`), exceto os fetches com `sideEffect`, que ainda são concluídos com o próprio resultado ou erro.

Use-o quando um usuário faz logout ou o usuário autenticado muda.

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

[Collection.push](/rest/api/Collection#push) e [unshift](/rest/api/Collection#unshift) recebem os args da Collection,
que escolhem as listas às quais adicionar, e uma linha ou uma lista de linhas.

```ts
ctrl.set(TodoResource.getList.schema.push, { userId: '1' }, [
  { id: '6', title: 'Buy milk' },
  { id: '7', title: 'Walk dog' },
]);
```

:::note Unions

Quando cada membro declara seu discriminador como um literal (como `readonly type = 'first'`), uma linha de
[Union](/rest/api/Union) é verificada em relação ao membro que ela seleciona, então `{ type: 'first', secondField: 1 }` é um
erro. Apenas campos declarados são aceitos, então uma chave lida por uma
função `schemaAttribute` deve ser declarada em cada membro.

:::

Passe uma função para derivar o valor a partir do armazenado. Isso [evita condições de corrida](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

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

Componentes em suspense para este [Endpoint](/rest/api/Endpoint) e args são resolvidos. Dados existentes para esse Endpoint e args são atualizados; as entities são mescladas com seus campos armazenados.

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

Isto é uma prova de conceito em :react[React]:vue[Vue]. Uma [implementação de websockets com Manager](../concepts/managers.md#data-stream)
é mais robusta.

### setError(endpoint, ...args, error) {#setError}

Armazena `error` como o resultado do [Endpoint](/rest/api/Endpoint) e dos args.

### resolve(endpoint, \{ args, response, fetchedAt, error }) {#resolve}

Resolve um fetch específico, armazenando a `response` no cache.

Como [setResponse](#setResponse), mas `fetchedAt` vincula a resposta a um fetch específico, de modo que a atualização
otimista desse fetch é removida.

O [NetworkManager](./NetworkManager.md) o utiliza. Use-o quando um Manager processar requisições de fetch.

Passe o `action.meta.fetchedAt` da action de fetch como `fetchedAt`. Assim, o store descarta respostas de fetches iniciados antes de
[resetEntireStore()](#resetEntireStore), e uma resposta antiga não conclui um fetch mais recente da mesma chave.

### subscribe(endpoint, ...args) {#subscribe}

Adiciona uma assinatura ao [Endpoint](/rest/api/Endpoint) e aos args. Cada chamada incrementa sua contagem de assinantes.

[useSubscription](./useSubscription.md) e [useLive](./useLive.md) chamam isso na montagem.

:react[Hooks]:vue[Composables] personalizados podem chamá-lo para assinar com base em outras condições.

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

Remove uma assinatura do [Endpoint](/rest/api/Endpoint) e dos args. Cada chamada decrementa sua contagem de assinantes; ao
chegar a 0, as atualizações automáticas param.

[useSubscription](./useSubscription.md) e [useLive](./useLive.md) chamam isso na desmontagem.

## Acesso a dados {#data-access}

### get(schema, ...args, state) {#get}

Busca qualquer [Schema](/rest/api/schema#schema-overview) [Queryable](/rest/api/schema#queryable) em `state`.

#### Exemplo {#example}

O [useQuery](./useQuery.md) é construído sobre ele, e os [Managers](./Manager.md) podem usá-lo para ler o store com segurança.

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

Nos componentes, [useQuery()](./useQuery.md) mantém o resultado reativo. Os handlers de eventos leem o valor atual dele:

```ts
const props = defineProps<{ id: string }>();
const ctrl = useController();
const todo = useQuery(Todo, () => ({ id: props.id }));

const toggle = () => {
  if (!todo.value) return;
  ctrl.set(
    Todo,
    { id: props.id },
    { id: props.id, completed: !todo.value.completed },
  );
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

Obtém a resposta de um endpoint e args a partir do `state` fornecido.

#### data {#data}

A resposta desnormalizada. Cada membro mantém a mesma referência enquanto seus dados não mudam.

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

- Sempre suspenderá:vue[ durante o setup; componentes montados [mantêm seus dados atuais](../concepts/expiry-policy.md#invalidate) até que o refetch seja resolvido]
- Sempre fará fetch

#### expiresAt {#expiresat}

Quando os dados expiram, como timestamp. Compare-o com `Date.now()`.

#### Example {#example-1}

[useCache](./useCache.md) e [useSuspense](./useSuspense.md) são construídos sobre ele. Os [Managers](./Manager.md) podem usá-lo para buscar uma
resposta no state fornecido.

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

Nos componentes, [useCache()](./useCache.md) e [useSuspense()](./useSuspense.md) mantêm o resultado reativo. Os handlers
de eventos leem o valor atual deles.

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

Obtém o erro de um endpoint e args, ou `undefined` se não houver nenhum.

### snapshot(state, fetchedAt) {#snapshot}

Returns a [Snapshot](./Snapshot.md).

### getState() {#getState}

Obtém o estado interno do Reactive Data Client que _já foi [confirmado (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)_.

::::warning

Use-o apenas fora de componentes: em [Managers](./Manager.md) ou em código como loaders de roteador.

:::react

Chamar getState() durante a renderização pode causar inconsistência de dados (data tearing).

:::

:::vue

Usar getState() em um `computed()` ou template não atualizará quando o store mudar. Use
[useQuery()](./useQuery.md) ou [useCache()](./useCache.md) nesses casos.

:::

::::

Para agir sobre o resultado de uma mutação, use o valor com que `fetch()` resolve em vez de `getState()`. Uma
[mutação](#endpointsideeffect) resolve _antes_ de o store ser atualizado, então `getState()` ainda não tem a resposta dela.
O valor resolvido é a resposta desnormalizada.

:::react

```tsx
import { useController } from '@data-client/react';
import { useNavigate } from 'react-router';
import { PostResource } from './PostResource';

function UpdatePost({ id }: { id: string }) {
  const ctrl = useController();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.update,
      { id },
      new FormData(e.currentTarget),
    );
    navigate(`/posts/${post.id}`);
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

:::

:::vue

```html title="UpdatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { useRouter } from 'vue-router';
  import { PostResource } from './PostResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();
  const router = useRouter();

  const handleSubmit = async (e: Event) => {
    const post = await ctrl.fetch(
      PostResource.update,
      { id: props.id },
      new FormData(e.target as HTMLFormElement),
    );
    router.push(`/posts/${post.id}`);
  };
</script>

<template>
  <form @submit.prevent="handleSubmit"><!-- ... --></form>
</template>
```

:::
