---
title: schema.Collection
---

<head>
  <title>schema.Collection - Entities of Arrays or Values</title>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';
import { v4 as uuid } from 'uuid';

`Collections` are entities but for [Arrays](./Array.md) or [Values](./Values.md).

This makes them well suited at handling mutations. You can add to [Array](./Array.md) `Collections` with [.push](#push) or [.unshift](#unshift) and
[Values](./Values.md) `Collections` with [.assign](#assign).

[RestEndpoint](./RestEndpoint.md) provides [.push](./RestEndpoint.md#push), [.unshift](./RestEndpoint.md#unshift), [.assign](./RestEndpoint.md#assign)
and [.getPage](./RestEndpoint.md#getpage)/[.paginated()](./RestEndpoint.md#paginated) extenders when using `Collections`

## Usage

<HooksPlayground fixtures={[
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

```ts title="api/Todo" {15} collapsed
export class Todo extends Entity {
  id = '';
  userId = 0;
  title = '';
  completed = false;

  pk() {
    return this.id;
  }
  static key = 'Todo';
}

export const getTodos = new RestEndpoint({
  path: '/todos',
  schema: new schema.Collection([Todo]),
});
```

```ts title="api/User" {15-19} collapsed
import { Todo } from './Todo';

export class User extends Entity {
  id = '';
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  pk() {
    return this.id;
  }
  static key = 'User';
  static schema = {
    todos: new schema.Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}

export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Collection([User]),
});
```

```tsx title="NewTodo" {9-10}
import { getTodos } from './api/Todo';

export default function NewTodo({ userId }: { userId?: string }) {
  const ctrl = useController();
  const [unshift, setUnshift] = React.useState(false);

  const handlePress = async e => {
    if (e.key === 'Enter') {
      const createTodo = unshift ? getTodos.unshift : getTodos.push;
      ctrl.fetch(createTodo, { title: e.currentTarget.value, userId });
      e.currentTarget.value = '';
    }
  };

  return (
    <div>
      <input type="text" onKeyDown={handlePress} />
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

</HooksPlayground>

## Options

### argsKey(...args): Object {#argsKey}

Returns a serializable Object whose members uniquely define this collection based
on Endpoint arguments.

```ts {7-9}
import { schema, RestEndpoint } from '@data-client/rest';

const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new schema.Collection([Todo], {
    argsKey: (urlParams: { userId?: string }) => ({
      ...urlParams,
    }),
  }),
});
```

### nestKey(parent, key): Object {#nestKey}

Returns a serializable Object whose members uniquely define this collection based
on the parent it is nested inside.

```ts {28-30}
import { schema, Entity } from '@data-client/rest';

class Todo extends Entity {
  id = '';
  userId = '';
  title = '';
  completed = false;

  pk() {
    return this.id;
  }
  static key = 'Todo';
}

class User extends Entity {
  id = '';
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  pk() {
    return this.id;
  }
  static key = 'User';
  static schema = {
    todos: new schema.Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}
```

### createCollectionFilter?

Sets a default `createCollectionFilter` for [addWith()](#addWith),
[push](#push), [unshift](#unshift), and [assign](#assign).

This is used by these creation schemas to determine which collections to add to.

Default:

```ts
const defaultFilter =
  (urlParams: Record<string, any>, body?: Record<string, any>) =>
  (collectionKey: Record<string, string>) =>
    Object.entries(collectionKey).every(
      ([key, value]) =>
        key.startsWith('order') ||
        // double equals lets us compare non-strings and strings
        urlParams[key] == value ||
        body?.[key] == value,
    );
```

## Methods

### push

A creation schema that places at the _end_ of this collection

### unshift

A creation schema that places at the _start_ of this collection

### assign

A creation schema that [assigns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
its members to the `Collection`.

### addWith(merge, createCollectionFilter): CreationSchema {#addWith}

Constructs a custom creation schema for this collection. This is used by
[push](#push), [unshift](#unshift), [assign](#assign) and [paginate](./RestEndpoint.md#paginated)

#### merge(collection, creation)

This [merges](#merge) the value with the existing collection

#### createCollectionFilter

This function is used to determine which collections to add to. It
uses the Object returned from [argsKey](#argsKey) or [nestKey](#nestKey) to
determine if that collection should get the newly created values from this schema.

Because arguments may be serializable types like `number`, we recommend using `==` comparisons,
e.g., `'10' == 10`

```typescript
(...args) =>
  collectionKey =>
    boolean;
```

## Lifecycle Methods

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

`true` return value will reorder incoming vs in-store entity argument order in merge. With
the default merge, this will cause the fields of existing entities to override those of incoming,
rather than the other way around.

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

`mergeWithStore()` is called during normalization when a processed entity is already found in the store.

### pk: (parent?, key?, args?): pk? {#pk}

`pk()` calls [argsKey](#argsKey) or [nestKey](#nestKey) depending on which are specified, and
then serializes the result for the pk string.

```ts
pk(value: any, parent: any, key: string, args: readonly any[]) {
  const obj = this.argsKey
    ? this.argsKey(...args)
    : this.nestKey(parent, key);
  for (const key in obj) {
    if (typeof obj[key] !== 'string') obj[key] = `${obj[key]}`;
  }
  return JSON.stringify(obj);
}
```
