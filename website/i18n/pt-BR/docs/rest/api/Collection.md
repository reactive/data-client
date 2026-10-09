---
title: Schema Collection - Listas e mapas mutáveis
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

`Collections` definem [Listas (Array)](./Array.md) ou [Mapas (Values)](./Values.md) mutáveis.

Isso significa que elas podem crescer e encolher. Você pode adicionar a `Collection(Array)` com [.push](#push) ou [.unshift](#unshift),
remover de `Collection(Array)` com [.remove](#remove), adicionar a `Collections(Values)` com [.assign](#assign)
e mover entre collections com [.move](#move).

[RestEndpoint](./RestEndpoint.md) fornece os extenders [.push](./RestEndpoint.md#push), [.unshift](./RestEndpoint.md#unshift), [.assign](./RestEndpoint.md#assign), [.remove](./RestEndpoint.md#remove), [.move](./RestEndpoint.md#move)
e [.getPage](./RestEndpoint.md#getpage)/ [.paginated()](./RestEndpoint.md#paginated) ao usar `Collections`

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

### Collection com Values {#collection-with-values}

Quando uma API retorna objetos indexados por chave em vez de arrays, combine `Collection` com [Values](./Values.md)
para habilitar mutações no resultado.

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

Isso permite adicionar ou atualizar entradas com [.assign](./Collection.md#assign). O corpo é um objeto
em que as chaves são as chaves da collection e os valores são os dados da entity a mesclar:

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

## Opções {#options}

`argsKey` e `nestKey` calculam a [pk](#pk) de uma `Collection`. `argsKey` é usado
quando uma `Collection` é normalizada como resultado de endpoint de nível superior; `nestKey` é
usado quando a mesma `Collection` está aninhada em uma [Entity](./Entity.md). Forneça
ambos para reutilizar uma única definição de `Collection` nos dois contextos.

### argsKey(...args): Object {#argsKey}

Retorna um Object serializável cujos membros definem de forma única esta collection com base
nos argumentos do Endpoint.

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

Quando omitido, `argsKey` assume o padrão `params => ({ ...params })`.

### nestKey(parent, key): Object {#nestKey}

Retorna um Object serializável cujos membros definem de forma única esta collection com base
no pai dentro do qual ela está aninhada.

A [pk](#pk) de uma `Collection` aninhada geralmente é melhor definida pelo que a contém.
Isso permite que instâncias aninhadas de `Collection` compartilhem estado quando suas chaves
têm o mesmo valor. Quando `argsKey` e `nestKey` retornam objetos com o mesmo formato,
as leituras de nível superior e as aninhadas resolvem para o mesmo estado da collection.

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

Nesse caso, `user.todos` e a resposta de `getTodos()` do exemplo de `argsKey`
são sempre o mesmo array (referencialmente igual). Adicione as duas funções de chave
à definição compartilhada da `Collection`:

```ts
const userTodos = new Collection([Todo], {
  argsKey: ({ userId }: { userId?: string }) => ({ userId }),
  nestKey: (parent: User) => ({ userId: parent.id }),
});
```

### nonFilterArgumentKeys? {#nonFilterArgumentKeys}

Uma alternativa conveniente a [argsKey](#argsKey)

`nonFilterArgumentKeys` define um teste para determinar quais [chaves de argumento](#argsKey)
_não_ são usadas para filtrar os resultados. Por exemplo, se sua API usa
'orderBy' para escolher uma ordenação, esse argumento não influenciaria quais
entities são incluídas na resposta.

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

Por conveniência, você também pode usar uma RegExp ou uma lista de strings:

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

Nesse caso, `author` e `group` são consideradas chaves de argumento de 'filtro',
o que significa que influenciarão se um item recém-criado deve ser adicionado
a essas listas. Por outro lado, `orderBy` não precisa corresponder
quando `push` é chamado.

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

### createCollectionFilter? {#createcollectionfilter}

Define um `createCollectionFilter` padrão para [addWith()](#addWith),
[push](#push), [unshift](#unshift) e [assign](#assign).

Ele é usado por esses schemas de criação para determinar a quais collections adicionar.

Padrão:

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

Esses schemas de criação/remoção podem ser usados com [Controller.set()](/docs/api/Controller#set) para atualizações
somente locais, sem requisições de rede. Para mutações baseadas em rede, veja os [extenders especializados do RestEndpoint](./RestEndpoint.md#push).

### push {#push}

Um schema de criação que coloca novos itens no _fim_ desta collection.

```ts
// Add a new todo to the end of the list (local only, no network request)
ctrl.set(getTodos.schema.push, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### unshift {#unshift}

Um schema de criação que coloca novos itens no _início_ desta collection.

```ts
// Add a new todo to the beginning of the list (local only)
ctrl.set(getTodos.schema.unshift, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### remove {#remove}

Um schema que remove itens de uma collection por valor.

O valor da entity é normalizado para extrair sua pk, que é então comparada com os membros da collection.
Os itens são removidos de todas as collections que correspondem aos args fornecidos (filtradas por [createCollectionFilter](#createcollectionfilter)).

```ts
// Remove from collections matching { userId: '1' } (local only)
ctrl.set(getTodos.schema.remove, { userId: '1' }, { id: '123' });
```

```ts
// Remove from all collections (empty args matches all)
ctrl.set(getTodos.schema.remove, {}, { id: '123' });
```

Para remoção baseada em rede que também atualiza a entity, veja [RestEndpoint.remove](./RestEndpoint.md#remove).

### move {#move}

Um schema que move itens entre collections. Ele remove a entity das collections que correspondem
ao seu estado _existente_ e a adiciona às collections que correspondem ao _novo_ estado da entity (derivado do último arg).

Isso funciona tanto para `Collection(Array)` quanto para `Collection(Values)`.

```ts
// Move todo from userId '1' collection to userId '2' collection (local only)
ctrl.set(
  getTodos.schema.move,
  { id: '10', userId: '2', title: 'Moved todo' },
  [{ id: '10' }, { userId: '2' }],
);
```

O filtro de remoção usa os valores **existentes** da entity no store para determinar a quais collections
ela pertence atualmente. O filtro de adição usa os valores mesclados da entity (existentes + último arg) para determinar
onde ela deve ser colocada.

Para moves baseados em rede, veja [RestEndpoint.move](./RestEndpoint.md#move).

### assign {#assign}

Um schema de criação que [atribui](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
seus membros a uma `Collection(Values)`. Disponível apenas para Collections que envolvem [Values](./Values.md).

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

Constrói um schema de criação personalizado para esta collection. Ele é usado por
[push](#push), [unshift](#unshift), [assign](#assign) e [paginate](./RestEndpoint.md#paginated)

#### merge(collection, creation) {#mergecollection-creation}

Isso [mescla](#merge) o valor com a collection existente

#### createCollectionFilter {#createcollectionfilter-1}

Esta função é usada para determinar a quais collections adicionar. Ela
usa o Object retornado por [argsKey](#argsKey) ou [nestKey](#nestKey) para
determinar se essa collection deve receber os valores recém-criados por este schema.

Como os argumentos podem ser tipos serializáveis como `number`, recomendamos usar comparações com `==`,
por exemplo, `'10' == 10`

```typescript
(...args) =>
  collectionKey =>
    boolean;
```

### moveWith(merge): MoveSchema {#moveWith}

Constrói um schema de move personalizado para esta collection. É análogo a [addWith](#addWith),
mas para operações de [move](#move). A função `merge` controla como as entities são adicionadas à
collection de destino, enquanto o comportamento de remoção é derivado automaticamente do
tipo da collection (Array ou Values).

Isso é útil quando você precisa controlar a posição de inserção dos itens movidos
(por exemplo, inserir no início em vez de no fim).

#### merge(collection, moved) {#mergecollection-moved}

Controla como a entity movida é adicionada à collection de destino.

A função de merge [`unshift`](#unshift-merge), exportada, coloca os itens no início:

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

### unshift (merge function) {#unshift-merge}

Uma função de merge que coloca os itens recebidos no _início_ da collection.
Use com [moveWith](#moveWith) ou [addWith](#addWith) para controlar a ordem de inserção.

```ts
import { unshift } from '@data-client/rest';
```

## Métodos de ciclo de vida {#lifecycle-methods}

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

Um valor de retorno `true` reordenará a ordem dos argumentos entre a entity recebida e a do store no merge. Com
o merge padrão, isso fará com que os campos das entities existentes sobrescrevam os das recebidas,
e não o contrário.

### static merge(existing, incoming): mergedValue {#merge}

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

`mergeWithStore()` é chamado durante a normalização quando uma entity processada já é encontrada no store.

### pk: (parent?, key?, args?, parentEntity?): pk? {#pk}

`pk()` chama [nestKey](#nestKey) quando está aninhada em uma Entity e ele está disponível;
caso contrário, chama [argsKey](#argsKey). Em seguida, serializa o resultado para a string
da pk.

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
