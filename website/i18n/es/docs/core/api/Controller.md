---
title: Controller - Acceso imperativo al store con tipado seguro
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

`Controller` es un singleton que proporciona acceso seguro al [store flux y su ciclo de vida](./Manager.md#control-flow) de Reactive Data Client.
`Controller` memoiza todo el acceso al store, lo que permite una garantía de igualdad referencial global y el máximo rendimiento
de renderizado y de recuperación de datos.

`Controller` se proporciona:

- A los [Managers](./Manager.md) como primer argumento de [Manager.middleware](./Manager.md#middleware)
- A :react[React]:vue[Vue] con [useController()](./useController.md)
- :react[En las [pruebas unitarias de hooks](../guides/unit-testing-hooks.md) con [renderDataHook()](./renderDataHook.md#controller)]:vue[En las [pruebas unitarias de composables](../guides/unit-testing-composables.md) con `renderDataCompose()` de `@data-client/vue/test`]

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

## Despachadores de Actions {#action-dispatchers}

### fetch(endpoint, ...args) {#fetch}

Hace fetch del endpoint con los args dados y actualiza la caché de Reactive Data Client con
la respuesta o el error al completarse.

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

`fetch` tiene el mismo valor de retorno que el [Endpoint](/rest/api/Endpoint) que se le pasa.
Al usar schemas, se devuelve el valor desnormalizado

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

[sideEffect](/rest/api/Endpoint#sideeffect) cambia el comportamiento

##### true {#true}

- Se resuelve _antes_ de [confirmar (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) las actualizaciones de la caché de Reactive Data Client. (React 16, 17)
- Cada llamada siempre provocará un nuevo fetch.

##### false | undefined {#false--undefined}

- Se resuelve _después_ de [confirmar (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) las actualizaciones de la caché de Reactive Data Client.
- Las solicitudes idénticas se deduplican globalmente; solo se permite una solicitud en curso a la vez.
  - Para asegurar que se inicie una solicitud _nueva_, asegúrate de abortar cualquier solicitud en curso existente.

### fetchIfStale(endpoint, ...args) {#fetchIfStale}

Hace fetch solo si el endpoint se considera '[obsoleto](../concepts/expiry-policy.md#stale)'.

Esto puede ser útil al precargar datos, ya que evita obtener de más datos que aún están actualizados.

Un [ejemplo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx) con un router de fetch-as-you-render:

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

Establece el [estado de caducidad](../concepts/expiry-policy.md) de todas las respuestas que coincidan con `testKey` como [obsoleto](../concepts/expiry-policy.md#stale).

A veces es útil para activar la actualización solo de los datos que se muestran actualmente
cuando hay muchas parametrizaciones en la caché.

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

Para reducir la carga, mejorar el rendimiento y mejorar la consistencia del estado, a menudo es
mejor [incluir los efectos secundarios de la mutación en la respuesta de la mutación](/rest/guides/side-effects).

:::

### invalidate(endpoint, ...args) {#invalidate}

Fuerza un nuevo fetch :react[y suspense ]en [useSuspense](./useSuspense.md) con el mismo Endpoint
y los mismos parámetros.:vue[ Los componentes montados [siguen mostrando sus datos actuales](../concepts/expiry-policy.md#invalidate)
hasta que se resuelva el nuevo fetch.]

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

Para actualizar mientras se siguen mostrando datos obsoletos, usa [Controller.fetch](#fetch).

:::

::::

:::tip[Invalida muchos endpoints a la vez]

Usa [schema.Invalidate](/rest/api/Invalidate) para invalidar todos los endpoints que contengan una entity determinada.

Para REST prueba a usar [Resource.delete](/rest/api/resource#delete)

```ts
// deletes MyResource(5)
// this will refetch MyResource.get({id: '5'})
// and remove it from MyResource.getList
controller.setResponse(MyResource.delete, { id: '5' }, { id: '5' });
```

:::

### invalidateAll(\{ testKey }) {#invalidateAll}

[Invalida](../concepts/expiry-policy#invalid) todas las [claves de endpoint](/rest/api/RestEndpoint#key) que coincidan con `testKey`.

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

Para actualizar mientras se siguen mostrando datos obsoletos, usa en su lugar [Controller.expireAll](#expireAll).

:::

::::

Aquí borramos solo los endpoints GET que usan el dominio test.com. Esto significa que los demás dominios permanecen en la caché.

```ts
const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

function useLogout() {
  const ctrl = useController();
  return () => ctrl.invalidateAll({ testKey });
}
```

Normalmente también es buena idea borrar la caché ante un 401 (no autorizado) con [LogoutManager](./LogoutManager.md).

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

Restablece/borra toda la caché de Reactive Data Client. Las solicitudes en curso no se resolverán.

Normalmente se usa al cerrar sesión o al cambiar de usuario autenticado.

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

Actualiza cualquier [Schema](/rest/api/schema#schema-overview) [Queryable](/rest/api/schema#queryable), o muchas entities a la vez con un schema [Array](/rest/api/Array) o [Values](/rest/api/Values).

```ts
ctrl.set(
  Todo,
  // which Todo to update
  { id: '5' },
  // merge this data into the Todo in the store
  { id: '5', title: 'tell me friends how great Data Client is' },
);
```

El valor se tipa según el schema: una [Entity](/rest/api/Entity) toma sus campos (los números y los strings pueden ser cualquiera de los dos),
mientras que una [Collection](/rest/api/Collection) o [All](/rest/api/All) toma una lista de filas. Una [Query](/rest/api/Query)
toma la entrada del schema que envuelve, ya que `set()` normaliza ese schema en lugar de revertir `process()`.

```ts
ctrl.set(TodoResource.getList.schema, [{ id: '5', completed: true }]);
```

:::note Unions

Cuando cada miembro declara su discriminador como un literal (como `readonly type = 'first'`), una fila de
[Union](/rest/api/Union) se comprueba contra el miembro que selecciona, por lo que `{ type: 'first', secondField: 1 }` es un
error. Solo se aceptan los campos declarados, así que una clave leída por una
función `schemaAttribute` debe declararse en cada miembro.

:::

Se pueden usar funciones como valor cuando se utilizan datos derivados. Esto [evita condiciones de carrera](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

```ts
const id = '2';
ctrl.set(Article, { id }, article => ({ id, votes: article.votes + 1 }));
```

#### set([Entity], rows) {#set-array}

Pasa un schema [Array](/rest/api/Array) (`[Todo]` o `new schema.Array(Todo)`) y una lista de filas para actualizar
muchas entities en una sola actualización del store. Cada fila se combina con su entity almacenada; las entities que no están en la lista no se modifican.

```ts
ctrl.set(
  [Todo],
  [
    { id: '5', completed: true },
    { id: '6', completed: false },
  ],
);
```

Las filas se tipan según los campos de la Entity; los números y los strings pueden ser cualquiera de los dos, y los valores de tipo objeto, array y Date no se
comprueban, ya que las filas son entrada sin procesar.

Para listas que mezclan tipos de Entity, usa una [Union](/rest/api/Union); cada fila se almacena según su `type`:

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

Para eliminar muchas entities a la vez, usa [Invalidate](/rest/api/Invalidate#batch-invalidation); las filas solo necesitan sus campos
pk:

```ts
ctrl.set([new schema.Invalidate(Todo)], [{ id: '5' }, { id: '6' }]);
```

Para eliminar una sola, pasa el schema Invalidate y su fila:

```ts
ctrl.set(new schema.Invalidate(Todo), { id: '5' });
```

Los schemas [Values](/rest/api/Values), en cambio, toman un objeto de filas:

```ts
ctrl.set(new schema.Values(Todo), {
  '5': { id: '5', completed: true },
  '6': { id: '6', completed: false },
});
```

Los schemas Array, Values e Invalidate no toman `args` (por lo que [Entity.pk()](/rest/api/Entity#pk) y [Entity.process()](/rest/api/Entity#process)
reciben `[]`) ni función de actualización. Las filas que comparten una pk se combinan en el orden de la lista, sin
[Entity.shouldReorder()](/rest/api/Entity#shouldreorder). Usa esto en lugar de llamar a `set()` una vez por fila, por ejemplo al
[agrupar en lotes actualizaciones de streams de alta frecuencia](../concepts/managers.md#batching).

:::react

<BatchSetDemo />

:::

### setResponse(endpoint, ...args, response) {#setResponse}

Almacena `response` en la caché para el [Endpoint](/rest/api/Endpoint) y los args dados.

Cualquier componente que esté en suspense para el [Endpoint](/rest/api/Endpoint) y los args dados se resolverá.

Si ya existen datos para el [Endpoint](/rest/api/Endpoint) y los args dados, se actualizarán.

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

Esto muestra una prueba de concepto en :react[React]:vue[Vue]; sin embargo, una [implementación de websockets con un Manager](../concepts/managers.md#data-stream)
sería mucho más robusta.

### setError(endpoint, ...args, error) {#setError}

Almacena el resultado de [Endpoint](/rest/api/Endpoint) y args como el error proporcionado.

### resolve(endpoint, \{ args, response, fetchedAt, error }) {#resolve}

Resuelve un fetch específico y almacena `response` en la caché.

Es similar a setResponse, salvo que activa la resolución de un fetch en curso.
Esto significa que la actualización optimista correspondiente dejará de aplicarse.

Se usa en [NetworkManager](./NetworkManager.md) y debe usarse al
procesar solicitudes de fetch.

### subscribe(endpoint, ...args) {#subscribe}

Marca una nueva suscripción a un [Endpoint](/rest/api/Endpoint) determinado. Esto debe incrementar la suscripción.

[useSubscription](./useSubscription.md) y [useLive](./useLive.md) lo llaman al montarse.

Puede ser útil para :react[hooks]:vue[composables] personalizados que se suscriban o cancelen la suscripción según otros factores.

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

Marca la finalización de la suscripción a un [Endpoint](/rest/api/Endpoint) determinado. Esto debe
decrementar la suscripción y, si el contador llega a 0, ya no se recibirán más actualizaciones automáticamente.

[useSubscription](./useSubscription.md) y [useLive](./useLive.md) lo llaman al desmontarse.

## Acceso a datos {#data-access}

### get(schema, ...args, state) {#get}

Busca cualquier [Schema](/rest/api/schema#schema-overview) [Queryable](/rest/api/schema#queryable) en `state`.

#### Ejemplo {#example}

Se usa en [useQuery](./useQuery.md) y puede usarse en
los [Managers](./Manager.md) para acceder al store de forma segura.

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

En los componentes, [useQuery()](./useQuery.md) mantiene el resultado reactivo. En los manejadores de eventos, pasa
[getState()](#getState) para leer el store más reciente:

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

Obtiene la respuesta (globalmente estable a nivel referencial) para un par endpoint/args dado a partir del state proporcionado.

#### data {#data}

Los datos de la respuesta desnormalizados. Garantiza estabilidad referencial global para todos los miembros.

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status) {#expirystatus}

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

##### Valid {#valid}

- Nunca entrará en suspense.
- Podría hacer fetch si los datos están obsoletos

##### InvalidIfStale {#invalidifstale}

- Entrará en suspense si los datos están obsoletos.
- Podría hacer fetch si los datos están obsoletos

##### Invalid {#invalid}

- Siempre entrará en suspense
- Siempre hará fetch

#### expiresAt {#expiresat}

Un número que representa el momento en que caduca. Compáralo con Date.now().

#### Ejemplo {#example-1}

Se usa en [useCache](./useCache.md) y [useSuspense](./useSuspense.md), y puede usarse en
los [Managers](./Manager.md) para buscar una respuesta con el state proporcionado.

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

En los manejadores de eventos, pasa [getState()](#getState) para leer el store más reciente, como en el
[ejemplo de getState()](#getState).

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

Obtiene el error, si lo hay, de un endpoint determinado. Devuelve undefined si no hay errores.

### snapshot(state, fetchedAt) {#snapshot}

Returns a [Snapshot](./Snapshot.md).

### getState() {#getState}

Obtiene el estado interno de Reactive Data Client que _ya se ha [confirmado (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)_.

::::warning

Esto solo debe usarse en manejadores de eventos o en [Managers](./Manager.md).

:::react

Usar getState() en el ciclo de renderizado de React puede provocar desincronización de datos (data tearing).

:::

:::vue

Usar getState() en un `computed()` o en una plantilla no se actualizará cuando cambie el store. Usa
en su lugar [useQuery()](./useQuery.md) o [useCache()](./useCache.md).

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

Las [mutaciones](#endpointsideeffect) se resuelven _antes_ de que se actualice el store, así que lee su resultado a partir
del valor con el que se resuelve `fetch()` en lugar de `getState()`.

:::
