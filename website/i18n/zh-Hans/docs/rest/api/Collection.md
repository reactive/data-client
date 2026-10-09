---
title: Collection Schema - 可变的列表与映射
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

`Collections` 用于定义可变的[列表（Array）](./Array.md)或[映射（Values）](./Values.md)。

这意味着它们可以增长和缩减。你可以用 [.push](#push) 或 [.unshift](#unshift) 向 `Collection(Array)` 添加元素，
用 [.remove](#remove) 从 `Collection(Array)` 中移除元素，用 [.assign](#assign) 向 `Collections(Values)` 添加元素，
并用 [.move](#move) 在集合之间移动元素。

使用 `Collections` 时，[RestEndpoint](./RestEndpoint.md) 提供了 [.push](./RestEndpoint.md#push), [.unshift](./RestEndpoint.md#unshift), [.assign](./RestEndpoint.md#assign), [.remove](./RestEndpoint.md#remove), [.move](./RestEndpoint.md#move)
和 [.getPage](./RestEndpoint.md#getpage)/ [.paginated()](./RestEndpoint.md#paginated) 扩展器

## 用法 {#usage}

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

### 结合 Values 使用 Collection {#collection-with-values}

当 API 返回的是带键的对象而非数组时，将 `Collection` 与 [Values](./Values.md) 结合使用，
即可对结果进行变更。

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

这样就可以用 [.assign](./Collection.md#assign) 添加或更新条目。body 是一个对象，
其键为集合中的键，值为要合并的 Entity 数据：

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

## 选项 {#options}

`argsKey` 和 `nestKey` 用于计算 `Collection` 的 [pk](#pk)。当 `Collection` 作为顶层
endpoint 结果被规范化时使用 `argsKey`；当同一个 `Collection` 嵌套在
[Entity](./Entity.md) 中时使用 `nestKey`。两者都提供，
就能在这两种场景中复用同一个 `Collection` 定义。

### argsKey(...args): Object {#argsKey}

返回一个可序列化的对象，其成员根据 Endpoint 参数
唯一确定这个集合。

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

省略时，`argsKey` 默认为 `params => ({ ...params })`。

### nestKey(parent, key): Object {#nestKey}

返回一个可序列化的对象，其成员根据该集合所嵌套的父级
唯一确定这个集合。

嵌套 `Collection` 的 [pk](#pk) 通常最好由它所嵌套的对象来定义。
这样当嵌套的 `Collection` 实例的键具有相同值时，它们就能共享状态。当 `argsKey` 和 `nestKey` 返回相同结构的对象时，
顶层读取和嵌套读取会解析到同一份集合状态。

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

这种情况下，`user.todos` 与 `argsKey` 示例中 `getTodos()` 的响应
始终是同一个（引用相等的）数组。在共享的 `Collection` 定义中
同时添加这两个键函数：

```ts
const userTodos = new Collection([Todo], {
  argsKey: ({ userId }: { userId?: string }) => ({ userId }),
  nestKey: (parent: User) => ({ userId: parent.id }),
});
```

### nonFilterArgumentKeys? {#nonFilterArgumentKeys}

[argsKey](#argsKey) 的一种便捷替代方案

`nonFilterArgumentKeys` 定义了一个判断条件，用于确定哪些[参数键](#argsKey)
_不_用于筛选结果。例如，如果你的 API 使用
'orderBy' 来选择排序方式——这个参数并不会影响响应中
包含哪些 Entity。

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

为了方便，你也可以使用 RegExp 或字符串列表：

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

这种情况下，`author` 和 `group` 被视为“筛选”参数键，
这意味着它们会影响新创建的条目是否应被添加
到这些列表中。而调用 `push` 时，`orderBy` 则
不需要匹配。

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

为 [addWith()](#addWith)、
[push](#push)、[unshift](#unshift) 和 [assign](#assign) 设置默认的 `createCollectionFilter`。

这些创建 schema 会用它来确定要添加到哪些集合中。

默认值：

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

## 方法 {#methods}

这些创建/移除 schema 可以与 [Controller.set()](/docs/api/Controller#set) 一起使用，进行不发起网络请求的
纯本地更新。基于网络的变更请参阅 [RestEndpoint 的专用扩展器](./RestEndpoint.md#push)。

### push {#push}

一种创建 schema，将新条目放到该集合的_末尾_。

```ts
// Add a new todo to the end of the list (local only, no network request)
ctrl.set(getTodos.schema.push, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### unshift {#unshift}

一种创建 schema，将新条目放到该集合的_开头_。

```ts
// Add a new todo to the beginning of the list (local only)
ctrl.set(getTodos.schema.unshift, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### remove {#remove}

一种按值从集合中移除条目的 schema。

Entity 值会被规范化以提取其 pk，然后与集合成员进行匹配。
条目会从所有与所提供参数匹配的集合中移除（由 [createCollectionFilter](#createcollectionfilter) 筛选）。

```ts
// Remove from collections matching { userId: '1' } (local only)
ctrl.set(getTodos.schema.remove, { userId: '1' }, { id: '123' });
```

```ts
// Remove from all collections (empty args matches all)
ctrl.set(getTodos.schema.remove, {}, { id: '123' });
```

如需基于网络、同时更新 Entity 的移除操作，请参阅 [RestEndpoint.remove](./RestEndpoint.md#remove)。

### move {#move}

一种在集合之间移动条目的 schema。它会把 Entity 从与其_现有_状态匹配的集合中移除，
并添加到与该 Entity _新_状态（由最后一个参数得出）匹配的集合中。

它同时适用于 `Collection(Array)` 和 `Collection(Values)`。

```ts
// Move todo from userId '1' collection to userId '2' collection (local only)
ctrl.set(
  getTodos.schema.move,
  { id: '10', userId: '2', title: 'Moved todo' },
  [{ id: '10' }, { userId: '2' }],
);
```

移除时的筛选会使用 store 中该 Entity 的**现有**值来确定它当前属于
哪些集合。添加时的筛选则使用合并后的 Entity 值（现有值 + 最后一个参数）来确定
它应被放到哪里。

基于网络的移动请参阅 [RestEndpoint.move](./RestEndpoint.md#move)。

### assign {#assign}

一种创建 schema，将其成员[赋值](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
到 `Collection(Values)` 中。仅适用于包裹了 [Values](./Values.md) 的 Collection。

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

为该集合构造一个自定义的创建 schema。
[push](#push)、[unshift](#unshift)、[assign](#assign) 和 [paginate](./RestEndpoint.md#paginated) 都使用了它

#### merge(collection, creation) {#mergecollection-creation}

它会将值与现有集合[合并](#merge)

#### createCollectionFilter {#createcollectionfilter-1}

这个函数用于确定要添加到哪些集合中。它
使用 [argsKey](#argsKey) 或 [nestKey](#nestKey) 返回的对象来
判断该集合是否应获得此 schema 新创建的值。

由于参数可能是 `number` 等可序列化类型，我们建议使用 `==` 比较，
例如 `'10' == 10`

```typescript
(...args) =>
  collectionKey =>
    boolean;
```

### moveWith(merge): MoveSchema {#moveWith}

为该集合构造一个自定义的移动 schema。它与 [addWith](#addWith) 类似，
但用于 [move](#move) 操作。`merge` 函数控制 Entity 如何被添加到
目标集合中，而移除行为则会根据
集合类型（Array 或 Values）自动推导。

当你需要控制被移动条目的插入位置时
（例如插到开头而不是追加到末尾），它会很有用。

#### merge(collection, moved) {#mergecollection-moved}

控制被移动的 Entity 如何添加到其目标集合中。

导出的 [`unshift`](#unshift-merge) 合并函数会把条目放到开头：

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

### unshift（合并函数） {#unshift-merge}

一个将传入条目放到集合_开头_的合并函数。
可与 [moveWith](#moveWith) 或 [addWith](#addWith) 搭配使用，以控制插入顺序。

```ts
import { unshift } from '@data-client/rest';
```

## 生命周期方法 {#lifecycle-methods}

### static shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldReorder}

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

返回 `true` 时，会在合并中调换传入 Entity 与 store 中 Entity 的参数顺序。在
默认的合并方式下，这会让现有 Entity 的字段覆盖传入 Entity 的字段，
而不是反过来。

### static merge(existing, incoming): mergedValue {#merge}

```typescript
static merge(existing: any, incoming: any) {
  return incoming;
}
```

### static mergeWithStore(existingMeta, incomingMeta, existing, incoming): mergedValue {#mergeWithStore}

```typescript
static mergeWithStore(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
): any;
```

在规范化期间，如果处理后的 Entity 已存在于 store 中，就会调用 `mergeWithStore()`。

### pk: (parent?, key?, args?, parentEntity?): pk? {#pk}

当嵌套在 Entity 中且 [nestKey](#nestKey) 可用时，`pk()` 会调用它；
否则调用 [argsKey](#argsKey)。随后它会序列化结果，作为 pk
字符串。

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
