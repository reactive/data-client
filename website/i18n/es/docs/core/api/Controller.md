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

`Controller` da acceso con tipado seguro al [store de Reactive Data Client y su ciclo de vida](./Manager.md#control-flow).
Cada store tiene un único `Controller`.

`Controller` memoiza la desnormalización para lograr igualdad referencial global: los datos del store que no cambian dan el
mismo objeto dondequiera que se lean. Así el renderizado y las búsquedas son rápidos.

`Controller` se proporciona:

- A los [Managers](./Manager.md) como primer argumento de [Manager.middleware](./Manager.md#middleware)
- A :react[React]:vue[Vue] con [useController()](./useController.md)
- :react[En las [pruebas unitarias de hooks](../guides/unit-testing-hooks.md) con [renderDataHook()](./renderDataHook.md#controller)]:vue[En las [pruebas unitarias de composables](../guides/unit-testing-composables.md) con `renderDataCompose()` de `@data-client/vue/test`]

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

## Despachadores de Actions {#action-dispatchers}

### fetch(endpoint, ...args) {#fetch}

Hace fetch del endpoint con los args dados. Cuando el fetch termina, la respuesta o el error se guardan en la caché.

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
Con un schema, devuelve el valor desnormalizado.

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

[sideEffect](/rest/api/Endpoint#sideeffect) cambia cómo se comporta `fetch()`:

##### true {#true}

- Se resuelve _antes_ de que se [confirme (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) la actualización de la caché.
- Cada llamada inicia un nuevo fetch.
- Si no se espera, se rechaza sin manejar, ya que ningún componente lee su error. Espéralo, o usa
  [useLoading()](./useLoading.md) para mostrar el error.

##### false | undefined {#false--undefined}

- Se resuelve _después_ de que se [confirme (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom) la actualización de la caché.
- Las solicitudes idénticas se deduplican, así que solo hay una en curso a la vez.
  - Para iniciar una solicitud _nueva_, aborta primero la que está en curso.
- Es seguro sin esperarlo: el error se guarda para los componentes que leen ese endpoint, así que nunca llega a los
  manejadores globales de rechazos no manejados ([repórtalo](../concepts/managers.md#error-reporting) en su lugar). `await` sigue rechazando.

### fetchIfStale(endpoint, ...args) {#fetchIfStale}

Hace fetch solo cuando los datos faltan, están [obsoletos](../concepts/expiry-policy.md#stale) o son [inválidos](../concepts/expiry-policy.md#invalid),
y siempre devuelve una Promise con el resultado del último fetch. Así se evita obtener de más datos actualizados al precargar.

| Caché | Hace fetch | `await` da | Sin esperar |
| --- | --- | --- | --- |
| Faltan, obsoletos o inválidos | Sí, como [fetch()](#fetch) | Los datos obtenidos, o se rechaza con su error | El error se guarda; no hay rechazo sin manejar |
| Actualizados | No | Los datos en caché | No pasa nada |
| El último fetch falló dentro de [errorExpiryLength](/rest/api/Endpoint#errorexpirylength) | No | Se rechaza con ese error, igual que [useSuspense()](./useSuspense.md) lo lanza | No pasa nada |

Por eso las precargas no necesitan esperarse ni capturar errores: los componentes que leen ese endpoint muestran el error guardado como siempre.
Los fallos que no se esperan no llegan a los manejadores globales de rechazos no manejados, así que reporta los errores de fetch con un
[Manager de reporte de errores](../concepts/managers.md#error-reporting). Un `.then()` encadenado al resultado crea una nueva
Promise, así que termina esa cadena con `.catch()`.

```ts
// start a secondary request without waiting for it
controller.fetchIfStale(CommentResource.getList, { issueId });
// wait for the data; rejects if that fetch fails
const issue = await controller.fetchIfStale(IssueResource.get, { id: issueId });
```

Para comprobar si los datos están en caché y actualizados sin hacer fetch, lee [getResponse()](#getResponse) de forma síncrona.

:::react

#### En los loaders de rutas {#fetchIfStale-loaders}

Un loader inicia los fetches de la siguiente página antes de que se renderice. Igual que [useSuspense()](./useSuspense.md), la navegación solo debería esperar
cuando los datos en caché no se pueden renderizar: cuando faltan, están invalidados o están obsoletos en un endpoint con
[invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale). Los datos obsoletos se renderizan de inmediato y
se vuelven a obtener. Cómo lograrlo depende de lo que espere el router:

| Router | En el loader | Nada en caché |
| --- | --- | --- |
| Cambia la ruta en una [transición](https://react.dev/reference/react/startTransition), como el App Router de Next.js, React Router 7, TanStack Router o [@anansi/router](https://www.npmjs.com/package/@anansi/router) | Inicia cada `fetchIfStale()` sin esperarlo, para que el router no tenga nada que esperar | La página actual se mantiene hasta que la nueva está lista, salvo que la nueva página tenga su propio límite de Suspense (como un [AsyncBoundary](./AsyncBoundary.md) o un `pendingComponent` de TanStack Router), que muestra su fallback. @anansi/router omite la transición al ir hacia atrás y hacia adelante |
| Renderiza el valor que devuelve el loader, o no cambia la ruta en una transición (React Router 6 sin su flag `v7_startTransition`) | Devuelve los datos en caché cuando se pueden renderizar; si no, devuelve `fetchIfStale()` | El router espera al fetch |

El App Router de Next.js no tiene loaders: `useSuspense()` hace fetch mientras la página se renderiza.

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

Cuando el renderizado en servidor espera al loader, como hace `prefetchSpout` de @anansi/core con `resolveData` de @anansi/router,
espera también el fetch de la primera vista para que el primer HTML incluya sus datos. Añade `.catch(() => {})` (o usa
`Promise.allSettled()` para varios), de modo que un fallo nunca se rechace sin manejar en el cliente; `useSuspense()` sigue mostrando el
error.

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

Un loader que devuelve un fetch pendiente permite al router mostrar su propia UI de carga y de error, pero retiene la navegación mientras
la solicitud está en curso. Esa contrapartida viene con esperar los datos del loader, sea lo que sea lo que los obtenga.

<StackBlitz app="github-app" file="src/routing/routes.tsx" view="editor" />

:::

### expireAll(\{ testKey }) {#expireAll}

Establece el [estado de caducidad](../concepts/expiry-policy.md) de todas las respuestas que coincidan con `testKey` como [obsoleto](../concepts/expiry-policy.md#stale).

Úsalo para actualizar solo los datos que están en pantalla cuando la caché contiene muchos conjuntos de args.

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

A menudo es mejor [incluir los efectos secundarios de la mutación en la respuesta de la mutación](/rest/guides/side-effects). Esto
reduce la carga, mejora el rendimiento y mantiene el estado consistente.

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

::::vue

:::tip[Mostrar de nuevo el fallback de Suspense]

Vuelve a montar el componente con un nuevo `key` después de invalidar; la nueva instancia entra en suspense con los datos inválidos.
`timeout="0"` hace que `<Suspense>` muestre su fallback mientras espera, en lugar del contenido anterior. Volver a montar
reinicia el estado local del componente.

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

Para actualizar mientras se siguen mostrando datos obsoletos, usa [Controller.fetch](#fetch).

:::

::::

:::tip[Invalida muchos endpoints a la vez]

Usa [schema.Invalidate](/rest/api/Invalidate) para invalidar todos los endpoints que contengan una entity determinada.

Para REST, prueba [Resource.delete](/rest/api/resource#delete).

```ts
// deletes MyResource(5)
// this will refetch MyResource.get({id: '5'})
// and remove it from MyResource.getList
controller.setResponse(MyResource.delete, { id: '5' }, { id: '5' });
```

:::

### invalidateAll(\{ testKey }) {#invalidateAll}

[Invalida](../concepts/expiry-policy.md#invalid) todas las [claves de endpoint](/rest/api/RestEndpoint#key) que coincidan con `testKey`.

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

El siguiente código invalida solo los endpoints GET del dominio test.com. Los demás dominios permanecen en la caché.

```ts
const myDomain = 'http://test.com';
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

function useLogout() {
  const ctrl = useController();
  return () => ctrl.invalidateAll({ testKey });
}
```

Borra también la caché ante un 401 (no autorizado) con [LogoutManager](./LogoutManager.md).

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

Borra toda la caché de Reactive Data Client. Las respuestas de los fetches en curso no se guardan. Esos fetches se rechazan con un `ResetError` (`error.name === 'ResetError'`), salvo los fetches con `sideEffect`, que se resuelven igualmente con su propio resultado o error.

Úsalo cuando un usuario cierra sesión o cambia el usuario autenticado.

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

[Collection.push](/rest/api/Collection#push) y [unshift](/rest/api/Collection#unshift) reciben los args de la Collection,
que eligen las listas a las que se agrega, y una fila o una lista de filas.

```ts
ctrl.set(TodoResource.getList.schema.push, { userId: '1' }, [
  { id: '6', title: 'Buy milk' },
  { id: '7', title: 'Walk dog' },
]);
```

:::note Unions

Cuando cada miembro declara su discriminador como un literal (como `readonly type = 'first'`), una fila de
[Union](/rest/api/Union) se comprueba contra el miembro que selecciona, por lo que `{ type: 'first', secondField: 1 }` es un
error. Solo se aceptan los campos declarados, así que una clave leída por una
función `schemaAttribute` debe declararse en cada miembro.

:::

Pasa una función para derivar el valor a partir del almacenado. Esto [evita condiciones de carrera](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state).

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

Los componentes en suspense para este [Endpoint](/rest/api/Endpoint) y estos args se resuelven. Los datos existentes para ese Endpoint y esos args se actualizan; las entities se fusionan con sus campos almacenados.

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

Esto es una prueba de concepto en :react[React]:vue[Vue]. Una [implementación de websockets con un Manager](../concepts/managers.md#data-stream)
es más robusta.

### setError(endpoint, ...args, error) {#setError}

Almacena `error` como el resultado del [Endpoint](/rest/api/Endpoint) y los args.

### resolve(endpoint, \{ args, response, fetchedAt, error }) {#resolve}

Resuelve un fetch específico y almacena `response` en la caché.

Como [setResponse](#setResponse), pero `fetchedAt` asocia la respuesta a un fetch concreto, de modo que se elimina la
actualización optimista de ese fetch.

[NetworkManager](./NetworkManager.md) lo usa. Úsalo cuando un Manager procese solicitudes de fetch.

Pasa el `action.meta.fetchedAt` de la acción fetch como `fetchedAt`. Así el store descarta las respuestas de fetches iniciados antes de
[resetEntireStore()](#resetEntireStore), y una respuesta antigua no resuelve un fetch más reciente de la misma clave.

### subscribe(endpoint, ...args) {#subscribe}

Añade una suscripción al [Endpoint](/rest/api/Endpoint) y los args. Cada llamada incrementa su número de suscriptores.

[useSubscription](./useSubscription.md) y [useLive](./useLive.md) lo llaman al montarse.

Los :react[hooks]:vue[composables] personalizados pueden llamarlo para suscribirse según otras condiciones.

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

Elimina una suscripción al [Endpoint](/rest/api/Endpoint) y los args. Cada llamada decrementa su número de suscriptores; al
llegar a 0, se detienen las actualizaciones automáticas.

[useSubscription](./useSubscription.md) y [useLive](./useLive.md) lo llaman al desmontarse.

## Acceso a datos {#data-access}

### get(schema, ...args, state) {#get}

Busca cualquier [Schema](/rest/api/schema#schema-overview) [Queryable](/rest/api/schema#queryable) en `state`.

#### Ejemplo {#example}

[useQuery](./useQuery.md) se basa en él, y los [Managers](./Manager.md) pueden usarlo para leer el store de forma segura.

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

En los componentes, [useQuery()](./useQuery.md) mantiene el resultado reactivo. Los manejadores de eventos leen su valor actual:

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

Obtiene la respuesta de un endpoint y unos args a partir del `state` dado.

#### data {#data}

La respuesta desnormalizada. Cada miembro conserva la misma referencia mientras sus datos no cambien.

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

- Siempre entrará en suspense:vue[ durante el setup; los componentes ya montados [conservan sus datos actuales](../concepts/expiry-policy.md#invalidate) hasta que se resuelva el refetch]
- Siempre hará fetch

#### expiresAt {#expiresat}

Cuándo caducan los datos, como marca de tiempo. Compáralo con `Date.now()`.

#### Ejemplo {#example-1}

[useCache](./useCache.md) y [useSuspense](./useSuspense.md) se basan en él. Los [Managers](./Manager.md) pueden usarlo para buscar una
respuesta en el state dado.

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

En los componentes, [useCache()](./useCache.md) y [useSuspense()](./useSuspense.md) mantienen el resultado reactivo. Los manejadores
de eventos leen su valor actual.

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

Obtiene el error de un endpoint y unos args, o `undefined` si no hay ninguno.

### snapshot(state, fetchedAt) {#snapshot}

Returns a [Snapshot](./Snapshot.md).

### getState() {#getState}

Obtiene el estado interno de Reactive Data Client que _ya se ha [confirmado (commit)](https://react.dev/learn/render-and-commit#step-3-react-commits-changes-to-the-dom)_.

::::warning

Úsalo solo fuera de los componentes: en [Managers](./Manager.md) o en código como los loaders de un router.

:::react

Llamar a getState() durante el renderizado puede provocar desincronización de datos (data tearing).

:::

:::vue

Usar getState() en un `computed()` o en una plantilla no se actualizará cuando cambie el store. Usa
en su lugar [useQuery()](./useQuery.md) o [useCache()](./useCache.md).

:::

::::

Para actuar sobre el resultado de una mutación, usa el valor con el que se resuelve `fetch()` en lugar de `getState()`. Una
[mutación](#endpointsideeffect) se resuelve _antes_ de que se actualice el store, así que `getState()` aún no tiene su respuesta.
El valor resuelto es la respuesta desnormalizada.

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
