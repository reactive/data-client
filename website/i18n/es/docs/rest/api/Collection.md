---
title: Schema Collection - Listas y mapas mutables
sidebar_label: Collection
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';
import { v4 as uuid } from 'uuid';
import { postFixtures,getInitialInterceptorData } from '@site/src/fixtures/posts-collection';

# Collection

`Collections` definen [listas (Array)](./Array.md) o [mapas (Values)](./Values.md) mutables.

Esto significa que pueden crecer y encogerse. Puedes añadir a un `Collection(Array)` con [.push](#push) o [.unshift](#unshift),
eliminar de un `Collection(Array)` con [.remove](#remove), añadir a un `Collections(Values)` con [.assign](#assign),
y mover elementos entre collections con [.move](#move).

[RestEndpoint](./RestEndpoint.md) proporciona [.push](./RestEndpoint.md#push), [.unshift](./RestEndpoint.md#unshift), [.assign](./RestEndpoint.md#assign), [.remove](./RestEndpoint.md#remove), [.move](./RestEndpoint.md#move)
y los extensores [.getPage](./RestEndpoint.md#getpage)/ [.paginated()](./RestEndpoint.md#paginated) cuando se usan `Collections`

## Uso {#usage}

<FrameworkPlayground row fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{
id: '1',
username: 'bob',
name: 'Bob',
todos: [
{ id: '123', title: 'Build Collections', userId: '1' },
{ id: '456', title: 'Add atomic creation', userId: '1' },
]
},
{
id: '2',
username: 'alice',
name: 'Alice',
todos: [
{ id: '34', title: 'Use Collections', userId: '2' },
{ id: '453', title: 'Make a fast web app', userId: '2' },
]
}
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/todos', method: 'POST'}),
args: [],
response(body) {
return {id: uuid(),...body};
},
delay: 150,
},
]}>

```ts title="api/Todo" {12-14,19} collapsed
import { Entity, RestEndpoint, Collection } from '@data-client/rest';

export class Todo extends Entity {
  id = '';
  userId = '';
  title = '';
  completed = false;

  static key = 'Todo';
}

export const userTodos = new Collection([Todo], {
  nestKey: (parent: { id: string }) => ({ userId: parent.id }),
});

export const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: userTodos,
});
```

```ts title="api/User" {13,19} collapsed
import { Entity, RestEndpoint, Collection } from '@data-client/rest';
import { Todo, userTodos } from './Todo';

export class User extends Entity {
  id = '';
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  static key = 'User';
  static schema = {
    todos: userTodos,
  };
}

export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new Collection([User]),
});
```

:::react

```tsx title="NewTodo" {11-15}
import React from 'react';
import { useController } from '@data-client/react';
import { getTodos } from './api/Todo';

export default function NewTodo({ userId }: { userId?: string }) {
  const ctrl = useController();
  const [unshift, setUnshift] = React.useState(false);

  const handlePress = async e => {
    if (e.key === 'Enter') {
      const createTodo = unshift ? getTodos.unshift : getTodos.push;
      ctrl.fetch(createTodo, {
        title: e.currentTarget.value,
        userId,
      });
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="listItem nogap">
      <TextInput size="small" onKeyDown={handlePress} />
      <label>
        <input
          type="checkbox"
          checked={unshift}
          onChange={e => setUnshift(e.currentTarget.checked)}
        />{' '}
        unshift
      </label>
    </div>
  );
}
```

```tsx title="TodoList" collapsed
import { type Todo } from './api/Todo';
import NewTodo from './NewTodo';

export default function TodoList({
  todos,
  userId,
}: {
  todos: Todo[];
  userId: string;
}) {
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.pk()}>{todo.title}</div>
      ))}
      <NewTodo userId={userId} />
    </div>
  );
}
```

```tsx title="UserList" collapsed
import { useSuspense } from '@data-client/react';
import { getUsers } from './api/User';
import TodoList from './TodoList';

function UserList() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <section key={user.pk()}>
          <h3>{user.name}</h3>
          <TodoList todos={user.todos} userId={user.id} />
        </section>
      ))}
    </div>
  );
}
render(<UserList />);
```

:::

:::vue

```html title="NewTodo.vue" {12-16}
<script setup lang="ts">
  import { ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { getTodos } from './api/Todo';

  const props = defineProps<{ userId?: string }>();
  const ctrl = useController();
  const unshift = ref(false);

  const handlePress = async e => {
    if (e.key === 'Enter') {
      const createTodo = unshift.value ? getTodos.unshift : getTodos.push;
      ctrl.fetch(createTodo, {
        title: e.currentTarget.value,
        userId: props.userId,
      });
      e.currentTarget.value = '';
    }
  };
</script>

<template>
  <div class="listItem nogap">
    <TextInput size="small" @keydown="handlePress" />
    <label>
      <input type="checkbox" v-model="unshift" />
      unshift
    </label>
  </div>
</template>
```

```html title="TodoList.vue" collapsed
<script setup lang="ts">
  import { type Todo } from './api/Todo';
  import NewTodo from './NewTodo.vue';

  defineProps<{ todos: readonly Todo[]; userId: string }>();
</script>

<template>
  <div>
    <div v-for="todo in todos" :key="todo.pk()">{{ todo.title }}</div>
    <NewTodo :userId="userId" />
  </div>
</template>
```

```html title="UserList.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUsers } from './api/User';
  import TodoList from './TodoList.vue';

  const users = await useSuspense(getUsers);
</script>

<template>
  <div>
    <section v-for="user in users" :key="user.pk()">
      <h3>{{ user.name }}</h3>
      <TodoList :todos="user.todos" :userId="user.id" />
    </section>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Collection con Values {#collection-with-values}

Cuando una API devuelve objetos con claves en lugar de arrays, combina `Collection` con [Values](./Values.md)
para habilitar mutaciones sobre el resultado.

```typescript
import { Entity, resource, Collection, Values } from '@data-client/rest';

class Stats extends Entity {
  product_id = '';
  volume = 0;
  price = 0;

  pk() {
    return this.product_id;
  }

  static key = 'Stats';
}

export const StatsResource = resource({
  urlPrefix: 'https://api.exchange.example.com',
  path: '/products/:product_id/stats',
  schema: Stats,
}).extend({
  getList: {
    path: '/products/stats',
    // Collection wraps Values to enable .push, .assign, etc.
    // highlight-next-line
    schema: new Collection(new Values(Stats)),
    process(value) {
      // Transform nested response structure
      Object.keys(value).forEach(key => {
        value[key] = {
          ...value[key].stats_24hour,
          product_id: key,
        };
      });
      return value;
    },
  },
});
```

Esto permite añadir o actualizar entradas con [.assign](./Collection.md#assign). El body es un objeto
cuyas claves son las claves de la collection y cuyos valores son los datos de la entity que se van a fusionar:

```typescript
// Local-only update with ctrl.set()
ctrl.set(StatsResource.getList.schema.assign, {}, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
});

// Network request with ctrl.fetch() - see RestEndpoint.assign
await ctrl.fetch(StatsResource.getList.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
});
```

## Opciones {#options}

`argsKey` y `nestKey` calculan el [pk](#pk) de un `Collection`. `argsKey` se usa
cuando un `Collection` se normaliza como resultado de un endpoint de nivel superior; `nestKey` se
usa cuando el mismo `Collection` está anidado en una [Entity](./Entity.md). Proporciona
ambos para reutilizar una misma definición de `Collection` en los dos contextos.

### argsKey(...args): Object {#argsKey}

Devuelve un Object serializable cuyos miembros definen de forma única esta collection según
los argumentos del Endpoint.

```ts {7-9}
import { RestEndpoint, Collection } from '@data-client/rest';

const userTodos = new Collection([Todo], {
  argsKey: (urlParams: { userId?: string }) => ({
    ...urlParams,
  }),
  nestKey: (parent: { id: string }) => ({
    userId: parent.id,
  }),
});

const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: userTodos,
});
```

Cuando se omite, `argsKey` toma por defecto `params => ({ ...params })`.

### nestKey(parent, key): Object {#nestKey}

Devuelve un Object serializable cuyos miembros definen de forma única esta collection según
el padre dentro del que está anidada.

El [pk](#pk) de un `Collection` anidado suele definirse mejor por aquello dentro de lo que está anidado.
Esto permite que las instancias anidadas de `Collection` compartan estado cuando sus claves
tienen el mismo valor. Cuando `argsKey` y `nestKey` devuelven objetos con la misma forma,
las lecturas de nivel superior y las anidadas se resuelven al mismo estado de la collection.

```ts {13}
import { Entity } from '@data-client/rest';
import { Todo, userTodos } from './Todo';

class User extends Entity {
  id = '';
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  static key = 'User';
  static schema = {
    todos: userTodos,
  };
}
```

En este caso, `user.todos` y la respuesta de `getTodos()` del ejemplo de `argsKey`
son siempre el mismo array (iguales por referencia). Añade ambas funciones de clave
a la definición compartida de `Collection`:

```ts
const userTodos = new Collection([Todo], {
  argsKey: ({ userId }: { userId?: string }) => ({ userId }),
  nestKey: (parent: User) => ({ userId: parent.id }),
});
```

### Opción nonFilterArgumentKeys? {#nonFilterArgumentKeys}

Una alternativa cómoda a [argsKey](#argsKey)

`nonFilterArgumentKeys` define una prueba para determinar qué [claves de argumentos](#argsKey)
_no_ se usan para filtrar los resultados. Por ejemplo, si tu API usa
'orderBy' para elegir un orden, este argumento no influiría en qué
entities se incluyen en la respuesta.

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Collection([Post], {
    // highlight-start
    nonFilterArgumentKeys(key) {
      return key === 'orderBy';
    },
    // highlight-end
  }),
});
```

Por comodidad, también puedes usar una RegExp o una lista de strings:

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Collection([Post], {
    // highlight-next-line
    nonFilterArgumentKeys: /orderBy/,
  }),
});
```

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Collection([Post], {
    // highlight-next-line
    nonFilterArgumentKeys: ['orderBy'],
  }),
});
```

En este caso, `author` y `group` se consideran claves de argumentos de 'filtro',
lo que significa que influirán en si un elemento recién creado debe añadirse
a esas listas. En cambio, `orderBy` no necesita coincidir
cuando se llama a `push`.

<FrameworkPlayground fixtures={postFixtures} getInitialInterceptorData={getInitialInterceptorData} row>

```ts title="getPosts" {14}
import { Entity, Query, Collection, RestEndpoint } from '@data-client/rest';

class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
export const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Query(
    new Collection([Post], {
      nonFilterArgumentKeys: /orderBy/,
    }),
    (posts, { orderBy } = {}) => {
      if (orderBy) {
        return [...posts].sort((a, b) => a[orderBy].localeCompare(b[orderBy]));
      }
      return posts;
    },
  )
});
```

:::react

```tsx title="PostListLayout" collapsed
import { useLoading } from '@data-client/react';

export default function PostListLayout({
  postsByBob,
  postsSorted,
  addPost,
}) {
  const [handleSubmit, loading] = useLoading(addPost);
  return (
    <div>
      <h4>&#123;group: 'react', author: 'bob'&#125;</h4>
      <ul>
        {postsByBob.map(post => (
          <li key={post.pk()}>
            {post.title} by {post.author}
          </li>
        ))}
      </ul>
      <h4>&#123;group: 'react', orderBy: 'title'&#125;</h4>
      <ul>
        {postsSorted.map(post => (
          <li key={post.pk()}>
            {post.title} by {post.author}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <div>Group: React</div>
        Author: 
        <label>
          <input type="radio" value="bob" name="author" defaultChecked />
          Bob
        </label>
        <label>
          <input type="radio" value="clara" name="author" />
          Clara
        </label>
        <TextInput defaultValue="New Post" name="title" label="Title" />
        <button type="submit">{loading ? 'loading...' : 'Push'}</button>
      </form>
    </div>
  );
}
```

```tsx title="PostList" collapsed
import { useSuspense, useController } from '@data-client/react';
import { getPosts } from './getPosts';
import PostListLayout from './PostListLayout';

function PostList() {
  const postsByBob = useSuspense(getPosts, {
    group: 'react',
    author: 'bob',
  });
  const postsSorted = useSuspense(getPosts, {
    group: 'react',
    orderBy: 'title',
  });

  const ctrl = useController();

  const addPost = (e) => {
    e.preventDefault();
    return ctrl.fetch(
      getPosts.push,
      { group: 'react' },
      new FormData(e.currentTarget),
    );
  }
  return (
    <PostListLayout
      postsByBob={postsByBob}
      postsSorted={postsSorted}
      addPost={addPost}
    />
  );
}
render(<PostList />);
```

:::

:::vue

```html title="PostListLayout.vue" collapsed
<script setup lang="ts">
  import { useLoading } from '@data-client/vue';

  const props = defineProps(['postsByBob', 'postsSorted', 'addPost']);
  const [handleSubmit, loading] = useLoading((e: Event) =>
    props.addPost(e),
  );
</script>

<template>
  <div>
    <h4>{group: 'react', author: 'bob'}</h4>
    <ul>
      <li v-for="post in postsByBob" :key="post.pk()">
        {{ post.title }} by {{ post.author }}
      </li>
    </ul>
    <h4>{group: 'react', orderBy: 'title'}</h4>
    <ul>
      <li v-for="post in postsSorted" :key="post.pk()">
        {{ post.title }} by {{ post.author }}
      </li>
    </ul>
    <form @submit="handleSubmit">
      <div>Group: React</div>
      Author:
      <label>
        <input type="radio" value="bob" name="author" checked />
        Bob
      </label>
      <label>
        <input type="radio" value="clara" name="author" />
        Clara
      </label>
      <TextInput value="New Post" name="title" label="Title" />
      <button type="submit">{{ loading ? 'loading...' : 'Push' }}</button>
    </form>
  </div>
</template>
```

```html title="PostList.vue" collapsed
<script setup lang="ts">
  import { useFetch, useSuspense, useController } from '@data-client/vue';
  import { getPosts } from './getPosts';
  import PostListLayout from './PostListLayout.vue';

  // start both fetches in parallel before awaiting
  useFetch(getPosts, { group: 'react', author: 'bob' });
  useFetch(getPosts, { group: 'react', orderBy: 'title' });
  const postsByBob = await useSuspense(getPosts, {
    group: 'react',
    author: 'bob',
  });
  const postsSorted = await useSuspense(getPosts, {
    group: 'react',
    orderBy: 'title',
  });

  const ctrl = useController();

  const addPost = (e: Event) => {
    e.preventDefault();
    return ctrl.fetch(
      getPosts.push,
      { group: 'react' },
      new FormData(e.currentTarget as HTMLFormElement),
    );
  };
</script>

<template>
  <PostListLayout
    :postsByBob="postsByBob"
    :postsSorted="postsSorted"
    :addPost="addPost"
  />
</template>
```

:::

</FrameworkPlayground>

### Opción createCollectionFilter? {#createcollectionfilter}

Establece un `createCollectionFilter` por defecto para [addWith()](#addWith),
[push](#push), [unshift](#unshift) y [assign](#assign).

Estos schemas de creación lo usan para determinar a qué collections se debe añadir.

Por defecto:

```ts
createCollectionFilter(...args: Args) {
  return (collectionKey: Record<string, string>) =>
    Object.entries(collectionKey).every(
      ([key, value]) =>
        this.nonFilterArgumentKeys(key) ||
        // strings are canonical form. See pk() above for value transformation
        `${args[0][key]}` === value ||
        `${args[1]?.[key]}` === value,
    );
}
```

## Métodos {#methods}

Estos schemas de creación/eliminación se pueden usar con [Controller.set()](/docs/api/Controller#set) para actualizaciones solo locales
sin peticiones de red. Para mutaciones basadas en red, consulta los [extensores especializados de RestEndpoint](./RestEndpoint.md#push).

### push {#push}

Un schema de creación que coloca los nuevos elementos al _final_ de esta collection.

```ts
// Add a new todo to the end of the list (local only, no network request)
ctrl.set(getTodos.schema.push, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### unshift {#unshift}

Un schema de creación que coloca los nuevos elementos al _principio_ de esta collection.

```ts
// Add a new todo to the beginning of the list (local only)
ctrl.set(getTodos.schema.unshift, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### remove {#remove}

Un schema que elimina elementos de una collection por valor.

El valor de la entity se normaliza para extraer su pk, que luego se compara con los miembros de la collection.
Los elementos se eliminan de todas las collections que coinciden con los args proporcionados (filtradas por [createCollectionFilter](#createcollectionfilter)).

```ts
// Remove from collections matching { userId: '1' } (local only)
ctrl.set(getTodos.schema.remove, { userId: '1' }, { id: '123' });
```

```ts
// Remove from all collections (empty args matches all)
ctrl.set(getTodos.schema.remove, {}, { id: '123' });
```

Para una eliminación basada en red que además actualiza la entity, consulta [RestEndpoint.remove](./RestEndpoint.md#remove).

### move {#move}

Un schema que mueve elementos entre collections. Elimina la entity de las collections que coinciden con
su estado _existente_ y la añade a las collections que coinciden con el _nuevo_ estado de la entity (derivado del último arg).

Funciona tanto con `Collection(Array)` como con `Collection(Values)`.

```ts
// Move todo from userId '1' collection to userId '2' collection (local only)
ctrl.set(
  getTodos.schema.move,
  { id: '10', userId: '2', title: 'Moved todo' },
  [{ id: '10' }, { userId: '2' }],
);
```

El filtro de eliminación usa los valores **existentes** de la entity en el store para determinar a qué collections
pertenece actualmente. El filtro de adición usa los valores fusionados de la entity (existentes + último arg) para determinar
dónde debe colocarse.

Para movimientos basados en red, consulta [RestEndpoint.move](./RestEndpoint.md#move).

### assign {#assign}

Un schema de creación que [asigna](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
sus miembros a un `Collection(Values)`. Solo está disponible para Collections que envuelven [Values](./Values.md).

```ts
const getStats = new RestEndpoint({
  path: '/products/stats',
  schema: new Collection(new Values(Stats)),
});

// Add/update entries in a Values collection (local only)
ctrl.set(getStats.schema.assign, {}, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
  'ETH-USD': { product_id: 'ETH-USD', volume: 500 },
});
```

### addWith(merge, createCollectionFilter): CreationSchema {#addWith}

Construye un schema de creación personalizado para esta collection. Lo usan
[push](#push), [unshift](#unshift), [assign](#assign) y [paginate](./RestEndpoint.md#paginated)

#### merge(collection, creation) {#mergecollection-creation}

Esto [fusiona](#merge) el valor con la collection existente

#### createCollectionFilter {#createcollectionfilter-1}

Esta función se usa para determinar a qué collections se debe añadir. Usa
el Object devuelto por [argsKey](#argsKey) o [nestKey](#nestKey) para
determinar si esa collection debe recibir los valores recién creados de este schema.

Como los argumentos pueden ser tipos serializables como `number`, recomendamos usar comparaciones con `==`,
por ejemplo, `'10' == 10`

```typescript
(...args) =>
  collectionKey =>
    boolean;
```

### moveWith(merge): MoveSchema {#moveWith}

Construye un schema de movimiento personalizado para esta collection. Es análogo a [addWith](#addWith)
pero para operaciones de [move](#move). La función `merge` controla cómo se añaden las entities a
su collection de destino, mientras que el comportamiento de eliminación se deriva automáticamente del
tipo de collection (Array o Values).

Esto es útil cuando necesitas controlar la posición de inserción de los elementos movidos
(por ejemplo, anteponer en lugar de añadir al final).

#### merge(collection, moved) {#mergecollection-moved}

Controla cómo se añade la entity movida a su collection de destino.

La función de fusión [`unshift`](#unshift-merge) exportada coloca los elementos al principio:

```ts
import { Collection, unshift, type CollectionOptions } from '@data-client/rest';
import type { PolymorphicInterface } from '@data-client/endpoint';

class MyCollection<
  S extends any[] | PolymorphicInterface = any,
  Args extends any[] = any[],
  Parent = any,
> extends Collection<S, Args, Parent> {
  constructor(schema: S, options?: CollectionOptions<Args, Parent>) {
    super(schema, options);
    // Prepend moved items instead of appending
    // highlight-next-line
    this.move = this.moveWith(unshift);
  }
}
```

### unshift (función de fusión) {#unshift-merge}

Una función de fusión que coloca los elementos entrantes al _principio_ de la collection.
Úsala con [moveWith](#moveWith) o [addWith](#addWith) para controlar el orden de inserción.

```ts
import { unshift } from '@data-client/rest';
```

## Métodos del ciclo de vida {#lifecycle-methods}

### Método estático shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldReorder}

```typescript
static shouldReorder(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return incomingMeta.fetchedAt < existingMeta.fetchedAt;
}
```

Un valor de retorno `true` reordenará el orden de los argumentos de la entity entrante frente a la almacenada en el store durante la fusión. Con
la fusión por defecto, esto hará que los campos de las entities existentes sobrescriban los de las entrantes,
en lugar de al revés.

### Método estático merge(existing, incoming): mergedValue {#merge}

```typescript
static merge(existing: any, incoming: any) {
  return incoming;
}
```

### Método estático mergeWithStore(existingMeta, incomingMeta, existing, incoming): mergedValue {#mergeWithStore}

```typescript
static mergeWithStore(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
): any;
```

`mergeWithStore()` se llama durante la normalización cuando una entity procesada ya se encuentra en el store.

### pk: (parent?, key?, args?, parentEntity?): pk? {#pk}

`pk()` llama a [nestKey](#nestKey) cuando está anidado en una Entity y está disponible;
en caso contrario llama a [argsKey](#argsKey). Luego serializa el resultado para obtener el
string del pk.

```ts
pk(
  value: any,
  parent: any,
  key: string,
  args: readonly any[],
  parentEntity?: any,
) {
  const obj =
    parentEntity && this.nestKey
      ? this.nestKey(parent, key)
      : this.argsKey(...args);
  for (const key in obj) {
    if (typeof obj[key] !== 'string') obj[key] = `${obj[key]}`;
  }
  return JSON.stringify(obj);
}
```
