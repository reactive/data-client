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

Using our [Create, Update, and Delete](/docs/concepts/atomic-mutations) endpoints with
[Controller.fetch()](../api/Controller.md#fetch) reactively updates _all_ appropriate components atomically (at the same time).

[useController()](../api/useController.md) gives components access to this global [setState()](https://react.dev/reference/react/useState#setstate)
on steriods.

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
  static key = 'Todo';
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
    <div className="listItem nogap">
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
import { useController } from '@data-client/react';
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
    <div className="listItem nogap">
      <label>
        <input type="checkbox" name="new" checked={false} disabled />
        <input type="text" onKeyDown={handleKeyDown} />
      </label>
      <CancelButton />
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

Rather than triggering invalidation cascades or using manually written update functions,
RDC reactively updates appropriate components using the fetch response.

## Optimistic mutations based on previous state {#optimistic-updates}

<HooksPlayground fixtures={postFixtures} getInitialInterceptorData={() => ({votes: {}})} row>

```ts title="Post" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';
  votes = 0;

  pk() {
    return this.id?.toString();
  }
  static key = 'Post';

  get img() {
    return `//placekitten.com/96/72?image=${this.id % 16}`;
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

```tsx title="TotalVotes" collapsed
import { Query, schema } from '@data-client/rest';
import { Post } from './PostResource';

const queryTotalVotes = new Query(
  new schema.All(Post),
  (posts, { userId } = {}) => {
    if (userId !== undefined)
      posts = posts.filter(post => post.userId === userId);
    return posts.reduce((total, post) => total + post.votes, 0);
  },
);

export default function TotalVotes({ userId }: { userId: number }) {
  const totalVotes = useCache(queryTotalVotes, { userId });
  return (
    <center>
      <small>{totalVotes} votes total</small>
    </center>
  );
}
```

```tsx title="PostList" collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './PostResource';
import PostItem from './PostItem';
import TotalVotes from './TotalVotes';

function PostList() {
  const userId = 2;
  const posts = useSuspense(PostResource.getList, { userId });
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      <TotalVotes userId={userId} />
    </div>
  );
}
render(<PostList />);
```

</HooksPlayground>

[getOptimisticResponse](/rest/guides/optimistic-updates) is just like [setState with an updater function](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state). [Snapshot](../api/Snapshot.md) provides typesafe access to the previous store value,
which we use to return the _expected_ fetch response.

Reactive Data Client ensures [data integrity against any possible networking failure or race condition](/rest/guides/optimistic-updates#optimistic-transforms), so don't
worry about network failures, multiple mutation calls editing the same data, or other common
problems in asynchronous programming.

## Tracking mutation loading

[useLoading()](../api/useLoading.md) enhances async functions by tracking their loading and error states.

<HooksPlayground fixtures={postFixtures} getInitialInterceptorData={() => ({entities:{}})} row>

```ts title="PostResource" collapsed
import { Entity, createResource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';
  votes = 0;

  pk() {
    return this.id?.toString();
  }
  static key = 'Post';

  get img() {
    return `//placekitten.com/96/72?image=${this.id % 16}`;
  }
}
export const PostResource = createResource({
  path: '/posts/:id',
  schema: Post,
});
```

```tsx title="PostDetail" collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './PostResource';

export default function PostDetail({ id }) {
  const post = useSuspense(PostResource.get, { id });
  return (
    <div>
      <div className="voteBlock">
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

```tsx title="PostForm" collapsed
export default function PostForm({ onSubmit, loading, error }) {
  const handleSubmit = e => {
    e.preventDefault();
    const data = new FormData(e.target);
    onSubmit(data);
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title:
        <br />
        <input type="text" name="title" defaultValue="My New Post" required />
      </label>
      <br />
      <label>
        Body:
        <br />
        <textarea name="body" rows={12} required>After clicking 'save', the button will be disabled until the POST is completed. Upon completion the newly created post is displayed immediately as Reactive Data Client is able to use the fetch response to populate the store.</textarea>
      </label>
      {error ? (
        <div className="alert alert--danger">{error.message}</div>
      ) : null}
      <div>
        <button type="submit" disabled={loading}>
          {loading ? 'saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
```

```tsx title="PostCreate" {8}
import { useController } from '@data-client/react';
import { useLoading } from '@data-client/hooks';
import { PostResource } from './PostResource';
import PostForm from './PostForm';

export default function PostCreate({ navigateToPost }) {
  const ctrl = useController();
  const [handleSubmit, loading, error] = useLoading(
    async data => {
      const post = await ctrl.fetch(PostResource.create, data);
      // React 17 does not batch updates
      // so we wait for the new post to be commited to the React
      // store to avoid additional fetches
      requestIdleCallback(() => navigateToPost(post.id));
    },
    [ctrl],
  );
  return (
    <PostForm onSubmit={handleSubmit} loading={loading} error={error} />
  );
}
```

```tsx title="Navigation" collapsed
import PostCreate from './PostCreate';
import PostDetail from './PostDetail';

function Navigation() {
  const [id, setId] = React.useState<undefined | number>(undefined);
  if (id) {
    return (
      <div>
        <PostDetail id={id} />
        <center>
          <button onClick={() => setId(undefined)}>New Post</button>
        </center>
      </div>
    );
  }
  return <PostCreate navigateToPost={setId} />;
}
render(<Navigation />);
```

</HooksPlayground>

React 18 version with [useTransition](https://react.dev/reference/react/useTransition)

```tsx
import { useTransition } from 'react';
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';
import PostForm from './PostForm';

export default function PostCreate({ setId }) {
  const ctrl = useController();
  const [loading, startTransition] = useTransition();
  const handleSubmit = data =>
    // highlight-next-line
    startTransition(async () => {
      const post = await ctrl.fetch(PostResource.create, data);
      setId(post.id);
    });
  return <PostForm onSubmit={handleSubmit} loading={loading} error={error} />;
}
```
