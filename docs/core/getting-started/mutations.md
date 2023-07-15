---
title: Data mutations
sidebar_label: Mutate Data
---

import ProtocolTabs from '@site/src/components/ProtocolTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { TodoResource } from '@site/src/components/Demo/code/todo-app/rest/resources';
import { todoFixtures } from '@site/src/fixtures/todos';
import { postFixtures } from '@site/src/fixtures/posts';
import { RestEndpoint } from '@data-client/rest';

<head>
  <title>Mutating Asynchronous Data with Reactive Data Client</title>
  <meta name="docsearch:pagerank" content="40"/>
</head>

## Tell react to update

Just like [setState()](https://react.dev/reference/react/useState#setstate), we must make React aware of the any mutations so it can rerender.

[Controller](../api/Controller.md) from [useController](../api/useController.md) provides this functionality in a type-safe manner.
[Controller.fetch()](../api/Controller.md#fetch) dispatches mutations like [Create, Update, and Delete](/docs/concepts/atomic-mutations).

[//]: # 'TODO: Add create, and delete examples as well (in tabs)'

<HooksPlayground defaultOpen="n" row fixtures={todoFixtures}>

```ts title="TodoResource" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Todo,
  optimistic: true,
});
```

```tsx title="TodoItem" {7-11,13-15}
import { useController } from '@data-client/react';
import { TodoResource, type Todo } from './TodoResource';

export default function TodoItem({ todo }: { todo: Todo }) {
  const ctrl = useController();
  const handleChange = e =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: e.currentTarget.checked },
    );
  const handleDelete = () =>
    ctrl.fetch(TodoResource.delete, {
      id: todo.id,
    });
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleChange}
        />
        {todo.completed ? <strike>{todo.title}</strike> : todo.title}
      </label>
      <CancelButton onClick={handleDelete} />
    </div>
  );
}
```

```tsx title="CreateTodo" {9-13} collapsed
import { v4 as uuid } from 'uuid';

import { TodoResource } from './TodoResource';

export default function CreateTodo({ userId }: { userId: number }) {
  const ctrl = useController();
  const handleKeyDown = async e => {
    if (e.key === 'Enter') {
      ctrl.fetch(TodoResource.create, {
        id: randomId(),
        userId,
        title: e.currentTarget.value,
      });
      e.currentTarget.value = '';
    }
  };
  return (
    <div>
      <input type="checkbox" name="new" checked={false} disabled />{' '}
      <input type="text" onKeyDown={handleKeyDown} />
    </div>
  );
}

function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
```

```tsx title="TodoList" collapsed
import { useSuspense } from '@data-client/react';
import { TodoResource } from './TodoResource';
import TodoItem from './TodoItem';
import CreateTodo from './CreateTodo';

function TodoList() {
  const userId = 1;
  const todos = useSuspense(TodoResource.getList, { userId });
  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.pk()} todo={todo} />
      ))}
      <CreateTodo userId={userId} />
    </div>
  );
}
render(<TodoList />);
```

</HooksPlayground>

Reactive Data Client uses the fetch response to reactively update all components atomically (at
the same time), rather than refetching.

<details>
<summary><b>Tracking imperative loading/error state</b></summary>

[useLoading()](../api/useLoading.md) enhances async functions by tracking their loading and error states.

```tsx
import { useController } from '@data-client/react';
import { useLoading } from '@data-client/hooks';

function ArticleEdit() {
  const ctrl = useController();
  // highlight-next-line
  const [handleSubmit, loading, error] = useLoading(
    data => ctrl.fetch(todoUpdate, { id }, data),
    [ctrl],
  );
  return <ArticleForm onSubmit={handleSubmit} loading={loading} />;
}
```

React 18 version with [useTransition](https://react.dev/reference/react/useTransition)

```tsx
import { useTransition } from 'react';
import { useController } from '@data-client/react';
import { useLoading } from '@data-client/hooks';

function ArticleEdit() {
  const ctrl = useController();
  const [loading, startTransition] = useTransition();
  const handleSubmit = data =>
    startTransition(() => ctrl.fetch(todoUpdate, { id }, data));
  return <ArticleForm onSubmit={handleSubmit} loading={loading} />;
}
```

</details>

## Optimistic mutations based on previous state {#optimistic-updates}

<HooksPlayground fixtures={postFixtures} getInitialInterceptorData={() => ({votes: {}})} row>

```ts title="Post" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  title = '';
  body = '';
  votes = 0;

  pk() {
    return this.id?.toString();
  }

  get img() {
    return `//placekitten.com/96/72?image=${this.id}`;
  }
}
export const Base = createResource({
  path: '/posts/:id',
  schema: Post,
});
```

```ts title="PostResource" {13-20}
import { AbortOptimistic, RestEndpoint } from '@data-client/rest';
import { Base, Post } from './Post';

export { Post };

export const PostResource = {
  ...Base,
  vote: new RestEndpoint({
    path: '/posts/:id/vote',
    method: 'POST',
    body: undefined,
    schema: Post,
    getOptimisticResponse(snapshot, { id }) {
      const { data } = snapshot.getResponse(Base.get, { id });
      if (!data) throw new AbortOptimistic();
      return {
        id,
        votes: data.votes + 1,
      };
    },
  }),
};
```

```tsx title="PostItem" {7} collapsed
import { useController } from '@data-client/react';
import { PostResource, type Post } from './PostResource';

export default function PostItem({ post }: { post: Post }) {
  const ctrl = useController();
  const handleVote = () => {
    ctrl.fetch(PostResource.vote, { id: post.id });
  };
  return (
    <div>
      <div className="voteBlock">
        <small className="vote">
          <button className="up" onClick={handleVote}>
            &nbsp;
          </button>
          {post.votes}
        </small>
        <img src={post.img} width="70" height="52" />
      </div>
      <div>
        <h4>{post.title}</h4>
        <p>{post.body}</p>
      </div>
    </div>
  );
}
```

```tsx title="PostList" collapsed
import { PostResource } from './PostResource';
import PostItem from './PostItem';

function PostList() {
  const userId = 2;
  const posts = useSuspense(PostResource.getList, { userId });
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
    </div>
  );
}
render(<PostList />);
```

</HooksPlayground>

[getOptimisticResponse](/rest/guides/optimistic-updates) is just like [setState with an updater function](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state). Using [snapshot](../api/Snapshot.md) for access to the store to get the previous
value, as well as the fetch arguments, we return the _expected_ fetch response.

Reactive Data Client ensures [data integrity against any possible networking failure or race condition](/rest/guides/optimistic-updates#optimistic-transforms), so don't
worry about network failures, multiple mutation calls editing the same data, or other common
problems in asynchronous programming.
