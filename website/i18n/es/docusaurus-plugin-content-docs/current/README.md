---
title: Presentamos Reactive Data Client
vue_title: Presentamos Reactive Data Client para Vue
sidebar_label: Introducción
description: Crea aplicaciones dinámicas y atractivas con NextJS, Expo, React Native y más.
vue_description: Crea aplicaciones dinámicas y atractivas con Vue y más.
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

# El Reactive Data Client

Reactive Data Client ofrece [acceso desde el cliente](./api/useSuspense.md) y [mutación](./api/Controller.md#fetch) seguros y de alto rendimiento sobre [protocolos de datos remotos](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/).
Se pueden usar simultáneamente tanto pull/fetch ([REST](/rest) y [GraphQL](/graphql)) como push/stream ([WebSockets o Server Sent Events](./concepts/managers.md#data-stream)).

Tiene objetivos similares
a los de las [bases de datos relacionales](https://en.wikipedia.org/wiki/Relational_database),
pero para clientes de aplicaciones interactivas. Por ello, **si tu backend usa un [RDBMS](https://en.wikipedia.org/wiki/Relational_database) como [Postgres](https://www.postgresql.org/)
o [MySQL](https://www.mysql.com/), es un buen indicio de que Reactive Data Client podría ser para ti**. Del mismo modo,
así como uno puede elegir [archivos planos](https://www.techopedia.com/definition/25956/flat-file) en lugar de almacenamiento en una base de datos,
a veces una librería cliente menos potente es suficiente.

No es una tarea menor. Para lograrlo, el diseño de Reactive Data Client apunta a **tratar los datos remotos como si fueran
locales**. Esto significa que la lógica de los componentes no debería ser más compleja que useState y setState.

## Define la API {#endpoint}

Los [Endpoints](./getting-started/resource.md) son los _métodos_ de tus datos. En esencia, son
simplemente funciones asíncronas. Sin embargo, también definen cualquier otro aspecto relevante de la [API](https://www.freecodecamp.org/news/what-is-an-api-in-english-please-b880a3214a82/),
como la [política de caducidad](./concepts/expiry-policy.md), el [modelo de datos](./concepts/normalization.md), la [validación](./concepts/validation.md) y los [tipos](/rest/api/RestEndpoint#typing).

<ThemedImage
alt="Endpoints usados en muchos contextos"
sources={{
    light: useBaseUrl('/img/endpoint-many.png'),
    dark: useBaseUrl('/img/endpoint-many.dark.png'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>

Al _desacoplar_ las definiciones de los endpoints de su uso, podemos reutilizarlos en muchos contextos.

- Reutilizarlos fácilmente en distintos **componentes** facilita ubicar las dependencias de datos junto a donde se usan
- Reutilizarlos con distintos **:react[[hooks](./api/useSuspense.md)]:vue[[composables](./api/useSuspense.md)]** y **[acciones imperativas](./api/Controller.md)** permite comportamientos diferentes con el mismo endpoint
- Reutilizarlos en distintas **[plataformas](./getting-started/installation.md)** :react[como React Native, React web, o incluso más allá de React, en Angular, Svelte, Vue o Node]:vue[como Vue web, o incluso más allá de Vue, en React, Angular, Svelte o Node]
- Publicarlos como **paquetes** independientes de su consumo

Los endpoints son extensibles y componibles, con implementaciones de protocolos ([REST](/rest), [GraphQL](/graphql), [Websockets+SSE](./concepts/managers.md#data-stream):react[, [Img/binary](./guides/img-media.md)])
para empezar rápidamente, extender y compartir patrones comunes.

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

## Ubica las dependencias de datos junto a su uso {#co-locate-data-dependencies}

Haz que tus componentes sean reutilizables enlazando los datos [donde los necesitas](./getting-started/data-dependency.md) con el [useSuspense()](./api/useSuspense.md) de una sola línea. Al igual que [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await),
[useSuspense()](./api/useSuspense.md) garantiza sus datos una vez que retorna.

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

Se acabó el prop drilling y la engorrosa gestión de estado externa. Reactive Data Client garantiza igualdad referencial global,
seguridad de los datos y rendimiento.

:::react

Ubicar las dependencias junto a su uso también permite que el [Server Side Rendering](./guides/ssr.md) transmita el HTML de forma incremental, reduciendo enormemente el [TTFB](https://web.dev/ttfb/).
[Reactive Data Client SSR](./guides/ssr.md) hidrata automáticamente su store, lo que permite mutaciones interactivas inmediatas con **cero** fetches
del lado del cliente en la primera carga.

:::

## Maneja la carga y los errores {#handle-loadingerror}

:::react

Evita cientos de indicadores de carga colocando [AsyncBoundary](./api/AsyncBoundary.md) alrededor de varios componentes que se suspenden.

Normalmente se colocan en o por encima de los límites de navegación, como páginas, rutas o modales.

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

También se puede usar el [manejo de fallback sin Suspense](./getting-started/data-dependency.md#stateful) en ciertos
casos en React 16 y 17

:::

:::vue

Evita cientos de indicadores de carga colocando el [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) integrado de Vue
alrededor de varios componentes que se suspenden. Su slot `#fallback` se renderiza mientras algún descendiente siga esperando datos.
Los errores se capturan con [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

Normalmente se colocan en o por encima de los límites de navegación, como páginas, rutas o modales.

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

También se puede usar el [manejo de fallback sin Suspense](./getting-started/data-dependency.md#stateful) en ciertos
casos.

:::

## Mutaciones {#mutations}

Las [mutaciones](./getting-started/mutations.md) presentan otro caso de reutilización, esta vez de nuestros datos. Este caso es aún más crítico
porque no solo puede producir código inflado, sino también problemas de integridad de datos, tearing y una aplicación con fallos visuales en general.

Cuando llamamos a nuestro método o endpoint de mutación, debemos asegurarnos de que **todos** los usos de esos datos se actualicen.
De lo contrario, nos quedamos con la complejidad, el bajo rendimiento y los tirones de la aplicación que provoca intentar
propagar en cascada las actualizaciones de los endpoints.

### Mantén los datos consistentes y actualizados {#entities}

Las [Entities](./concepts/normalization.md) definen nuestro modelo de datos.

Esto habilita un patrón de almacenamiento [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself), que
evita los fallos visuales por 'data tearing' y mejora el rendimiento.

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

El método [pk()](/rest/api/Entity#pk) (clave primaria) se usa para construir una tabla de búsqueda. Esto se
conoce comúnmente como normalización de datos. Para evitar errores, fallos visuales y problemas de rendimiento,
es fundamental [elegir la estructura de estado correcta (normalizada)](https://react.dev/learn/choosing-the-state-structure).

Ahora podemos enlazar nuestra Entity tanto a nuestro endpoint de obtención como al de actualización, lo que nos da integridad de datos
en tiempo de ejecución, además de definiciones de TypeScript.

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

### Dile a :react[react]:vue[Vue] que se actualice {#tell-reactreactvuevue-to-update}

Así como con :react[`setState()`]:vue[la asignación a un `ref()`], debemos hacer que :react[React]:vue[Vue] se entere de cualquier mutación para que pueda volver a renderizar.

[Controller](./api/Controller.md) ofrece esta funcionalidad con tipado seguro.
[Controller.fetch()](./api/Controller.md#fetch) nos permite disparar mutaciones.

Podemos usar [useController](./api/useController.md) para acceder a él en componentes de :react[React]:vue[Vue].

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
<summary><b>Seguimiento imperativo del estado de carga y de error</b></summary>

[useLoading()](./api/useLoading.md) mejora las funciones asíncronas haciendo seguimiento de sus estados de carga y de error.

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

### Más modelado de datos {#more-data-modeling}

¿Y si nuestra entity no es el elemento de nivel superior? Aquí definimos el endpoint `getList`
con [new Collection([Todo])](/rest/api/Collection) como su schema. Los [Schemas](./concepts/normalization.md#schema) le indican a Reactive Data Client _dónde_ encontrar
las Entities. Al colocarla dentro de una lista, Reactive Data Client sabe que debe esperar una respuesta
en la que cada elemento de la lista sea la entity especificada.

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

Los [Schemas](./concepts/normalization.md) también infieren y hacen cumplir automáticamente el tipo de la respuesta, lo que garantiza
que la variable `todos` tenga un tipo preciso.

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

Ya hemos usado nuestro modelo de datos en tres casos: `TodoResource.get`, `TodoResource.getList` y `TodoResource.update`. La consistencia de los datos
(así como la igualdad referencial) estará garantizada entre los endpoints, incluso después de que ocurran mutaciones.

### Organización de los Endpoints {#organizing-endpoints}

En este punto hemos definido `TodoResource.get`, `TodoResource.getList` y `TodoResource.update`. Quizás hayas notado
que estas definiciones de endpoints comparten cierta lógica e información. Por eso, Reactive Data Client
recomienda extraer la lógica compartida entre endpoints.

Los [Resources](/rest/api/resource) son colecciones de endpoints que operan sobre los mismos datos.

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

[Introducción a Resource](./getting-started/resource.md)

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

### Mutaciones sin demora {#optimistic-updates}

:::react

[Controller.fetch](./api/Controller.md#fetch) llama al endpoint de mutación y actualiza React según la respuesta.
Aunque [useTransition](https://react.dev/reference/react/useTransition) mejora la experiencia,
la UI en última instancia sigue esperando a que termine el fetch para actualizarse.

:::

:::vue

[Controller.fetch](./api/Controller.md#fetch) llama al endpoint de mutación y actualiza Vue según la respuesta.
La UI en última instancia sigue esperando a que termine el fetch para actualizarse.

:::

En muchos casos, como alternar todo.completed, incrementar un voto positivo o arrastrar y soltar
un fotograma, ¡esto puede ser demasiado lento!

Opcionalmente, podemos indicarle a Reactive Data Client que realice los renders de :react[React]:vue[Vue] de inmediato. Para ello
tendremos que especificar _cómo_.

[getOptimisticResponse](/rest/guides/optimistic-updates) es igual que :react[[setState con una función actualizadora](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)]:vue[una función actualizadora]. Usando [snap](./api/Snapshot.md) para acceder al store y obtener el valor
anterior, así como los argumentos del fetch, devolvemos la respuesta del fetch _esperada_.

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

Reactive Data Client garantiza la [integridad de los datos frente a cualquier posible fallo de red o condición de carrera](/rest/guides/optimistic-updates#optimistic-transforms), así que no
te preocupes por los fallos de red, por varias llamadas de mutación que editan los mismos datos, ni por otros problemas
comunes de la programación asíncrona.

### Mutaciones disparadas de forma remota {#remotely-triggered-mutations}

A veces el cambio de los datos se inicia de forma remota, ya sea por otros usuarios del sitio, administradores, etc. Los controles declarativos de
[política de caducidad](./concepts/expiry-policy.md) permiten un control preciso sobre las actualizaciones debidas al fetching.

Sin embargo, para los datos que cambian con frecuencia (como los tickers de precios de bolsa o las conversaciones en vivo) a veces se usan protocolos
basados en push, como Websockets o Server Sent Events. Reactive Data Client tiene una [potente capa de middleware llamada Managers](./api/Manager.md),
que se puede usar para [iniciar actualizaciones de datos](./concepts/managers.md#data-stream) cuando se reciben nuevos datos enviados desde el servidor.

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

Si no queremos el flujo de datos completo, podemos usar [useSubscription()](./api/useSubscription.md) o [useLive()](./api/useLive.md)
para asegurarnos de escuchar únicamente los datos que nos interesan.

Los endpoints con [pollFrequency](/rest/api/RestEndpoint#pollfrequency) permiten reutilizar los endpoints HTTP existentes, lo que elimina
la necesidad de backends adicionales de websocket o SSE.
El sondeo (polling) es orquestado globalmente por el [SubscriptionManager](./api/SubscriptionManager.md), así que incluso con muchos
componentes suscritos Reactive Data Client nunca hará fetches en exceso.

[//]: # 'TODO: ## Relational joins and nesting'

## Depuración {#debugging}

<img src={require('@site/static/img/redux-devtools-logo.jpg').default} width="75" height="75" alt="redux-devtools" style={{ float: 'left', "marginRight": "var(--ifm-paragraph-margin-bottom)" }} />

Agrega Redux DevTools como
[extensión de Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
o
[extensión de Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

Haz clic en el ícono para abrir el [inspector](./getting-started/debugging.md), que te permite observar las acciones despachadas,
su efecto sobre el estado del caché, así como el estado actual del caché.

## Datos simulados {#mock-data}

Escribir [Fixtures](./api/Fixtures.md) es un formato estándar que se puede usar con todos los helpers de `@data-client/test`, así como en tus propios usos.

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

- :react[[Simula datos para storybook](./guides/storybook.md) con [MockResolver](./api/MockResolver.md)]:vue[Simula datos con `MockPlugin` de `@data-client/vue/test`]
- :react[[Prueba hooks](./guides/unit-testing-hooks.md) con [renderDataHook()](./api/renderDataHook.md)]:vue[[Prueba composables](./guides/unit-testing-composables.md) con `renderDataCompose()`]
- :react[[Prueba componentes](./guides/unit-testing-components.md) con [MockResolver](./api/MockResolver.md)]:vue[[Prueba componentes](./guides/unit-testing-components.md) con `mountDataClient()`] y [mockInitialState()](./api/mockInitialState.md)

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

[![Explorar en GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/todo-app)
</TabItem>

  <TabItem value="github">
<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?embed=1&file=src%2Fpages%2FIssueList.tsx&hidedevtools=1&view=preview&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explorar en GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/github-app)
</TabItem>
<TabItem value="nextjs">

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?embed=1&file=components%2Ftodo%2FTodoList.tsx&hidedevtools=1&view=both&terminalHeight=0&showSidebar=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

[![Explorar en GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/nextjs)
</TabItem>
</Tabs>

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/pages/UserTodos.vue,src/resources/TodoResource.ts" view="both" />

[![Explorar en GitHub](https://badgen.net/badge/icon/github?icon=github&label)](https://github.com/reactive/data-client/tree/master/examples/vue-todo-app)

:::

<div style={{ textAlign: 'center' }}>
<Link className="button button--secondary" to="/demos">Más demos</Link>&nbsp;
<Link className="button button--secondary" to="https://skills.sh/reactive/data-client"><img src="/img/anthropic.svg" alt="Agent Skills" style={{
          height: '1em',
          verticalAlign: '-0.125em',
          display: 'inline',
        }}
/> Agent Skills</Link>
</div>
