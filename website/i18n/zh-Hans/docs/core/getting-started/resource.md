---
title: 为 Reactive Data Client 定义 Resource
sidebar_label: 定义数据
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import ProtocolTabs from '@site/src/components/ProtocolTabs';
import PkgInstall from '@site/src/components/PkgInstall';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import Link from '@docusaurus/Link';

# 定义 Resource

[Resource](/rest/api/resource) 是针对某个 `data model` 的一组 `methods`。

[Entity](/rest/api/Entity) 和 [schema](/rest/api/schema) 以声明式方式定义[_数据模型_](../concepts/normalization.md)。
[Endpoint](/rest/api/Endpoint) 则是作用于这些数据的
[_方法_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>)。

<Tabs
defaultValue="rest"
groupId="protocol"
values={[
{ label: 'REST', value: 'rest' },
{ label: 'GraphQL', value: 'gql' },
{ label: 'Async/Promise', value: 'other' },
]}>
<TabItem value="rest">

<PkgInstall pkgs="@data-client/rest" />

<div style={{ textAlign: 'center' }}>
<Link className="button button--secondary button--sm" to="https://chatgpt.com/g/g-682609591fe48191a6850901521b4e4b-typescript-rest-codegen"><img src="/img/gpt.svg" alt="Codegen GPT" style={{
          height: '1em',
          verticalAlign: '-0.125em',
          display: 'inline',
        }}
/> Codegen</Link>&nbsp;
<Link className="button button--secondary button--sm" to="https://skills.sh/reactive/data-client"><img src="/img/copilot.svg" alt="Skills" style={{
          height: '1em',              // Match font size
          verticalAlign: '-0.125em',  // Fine-tune: try -0.125em or 'middle'
          display: 'inline',          // Inline with text
        }}
/> Skills</Link>
</div>



[resource()](/rest/api/resource) 会构建一个由 [RestEndpoint](/rest/api/RestEndpoint) 组成的命名空间

<TypeScriptEditor row={false}>

```typescript title="TodoResource"
import { Entity, resource } from '@data-client/rest';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}

export const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  searchParams: {} as { userId?: string | number } | undefined,
  paginationField: 'page',
});

/** Methods can be called as functions or used in hooks */

// GET https://jsonplaceholder.typicode.com/todos/5
TodoResource.get({ id: 5 });
// GET https://jsonplaceholder.typicode.com/todos
TodoResource.getList();
// GET https://jsonplaceholder.typicode.com/todos?userId=1
TodoResource.getList({ userId: 1 });
// POST https://jsonplaceholder.typicode.com/todos
TodoResource.getList.push({ title: 'my todo' });
// POST https://jsonplaceholder.typicode.com/todos?userId=1
TodoResource.getList.push({ userId: 1 }, { title: 'my todo' });
// GET https://jsonplaceholder.typicode.com/todos?userId=1&page=2
TodoResource.getList.getPage({ userId: 1, page: 2 });
// PUT https://jsonplaceholder.typicode.com/todos/5
TodoResource.update({ id: 5 }, { title: 'my todo' });
// PATCH https://jsonplaceholder.typicode.com/todos/5
TodoResource.partialUpdate({ id: 5 }, { title: 'my todo' });
// PATCH https://jsonplaceholder.typicode.com/todos/5
TodoResource.getList.move({ id: 5 }, { completed: true });
// DELETE https://jsonplaceholder.typicode.com/todos/5
TodoResource.delete({ id: 5 });
```

</TypeScriptEditor>

</TabItem>
<TabItem value="gql">

<PkgInstall pkgs="@data-client/graphql" />

[GQLEndpoint](/graphql/api/GQLEndpoint) 可帮助你快速定义[查询](/graphql/api/GQLEndpoint#query)和[变更](/graphql/api/GQLEndpoint#mutate)

<TypeScriptEditor row={false}>

```typescript title="TodoResource"
import { GQLEndpoint, GQLEntity } from '@data-client/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  title = '';
  completed = false;

  static key = 'Todo';
}

export const TodoResource = {
  getList: gql.query(
    `
  query GetTodos {
    todo {
      id
      title
      completed
    }
  }
`,
    { todos: new Collection([Todo]) },
  ),
  update: gql.mutation(
    `mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }`,
    { updateTodo: Todo },
  ),
};
```

</TypeScriptEditor>

</TabItem>
<TabItem value="other">

<PkgInstall pkgs="@data-client/endpoint" />

借助 [Endpoint](/rest/api/Endpoint) 和 [EntityMixin](/rest/api/EntityMixin)，现有的 TypeScript 定义
可以直接在 <abbr title="Reactive Data Client">Data Client</abbr> 中使用。

<TypeScriptEditor row={false}>

```typescript title="existing/Todo" collapsed
export class Todo {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
}

/* These are just examples but it could be any promise API */
export const getTodo = (id: string) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(
    res => res.json(),
  );

export const getTodoList = () =>
  fetch('https://jsonplaceholder.typicode.com/todos').then(res =>
    res.json(),
  );

export const updateTodo = (id: string, body: Partial<Todo>) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }).then(res => res.json());

export const partialUpdateTodo = (id: string, body: Partial<Todo>) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(res => res.json());

export const createTodo = (body: Partial<Todo>) =>
  fetch(`https://jsonplaceholder.typicode.com/todos`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(res => res.json());

export const deleteTodo = (body: Partial<Todo>) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
    method: 'DELETE',
  }).then(res => res.json());
```

```typescript title="TodoResource"
import { Collection, Endpoint, EntityMixin, Invalidate } from '@data-client/endpoint';
import {
  Todo,
  getTodo,
  getTodoList,
  updateTodo,
  partialUpdateTodo,
  createTodo,
  deleteTodo,
} from './existing/Todo';

export const TodoEntity = EntityMixin(Todo, { key: 'Todo' });

export const TodoResource = {
  get: new Endpoint(getTodo, { schema: TodoEntity }),
  getList: new Endpoint(getTodoList, {
    schema: new Collection([TodoEntity]),
  }),
  update: new Endpoint(updateTodo, {
    schema: TodoEntity,
    sideEffect: true,
  }),
  partialUpdate: new Endpoint(partialUpdateTodo, {
    schema: TodoEntity,
    sideEffect: true,
  }),
  create: new Endpoint(createTodo, {
    schema: new Collection([TodoEntity]).push,
    sideEffect: true,
  }),
  delete: new Endpoint(deleteTodo, {
    schema: new Invalidate(TodoEntity),
    sideEffect: true,
  }),
};
```

</TypeScriptEditor>

</TabItem>
</Tabs>

<!--
  <TabItem value="sse">

```ts
import type {
  Manager,
  Middleware,
  EndpointInterface,
} from '@data-client/react';

export default class StreamManager implements Manager {
  protected declare middleware: Middleware;
  protected declare evtSource: WebSocket | EventSource;
  protected declare endpoints: Record<string, EndpointInterface>;

  constructor(
    evtSource: WebSocket | EventSource,
    endpoints: Record<string, EndpointInterface>,
  ) {
    this.evtSource = evtSource;
    this.endpoints = endpoints;

    this.middleware = controller => {
      this.evtSource.onmessage = event => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type in this.endpoints)
            controller.setResponse(
              this.endpoints[msg.type],
              ...msg.args,
              msg.data,
            );
        } catch (e) {
          console.error('Failed to handle message');
          console.error(e);
        }
      };
      return next => async action => next(action);
    };
  }

  cleanup() {
    this.evtSource.close();
  }

  getMiddleware() {
    return this.middleware;
  }
}
```

  </TabItem>
<TabItem value="img">

<PkgInstall pkgs="@data-client/img" />

</TabItem>
-->

为了帮助定义 `Resources`，我们为 [REST](/rest)、[GraphQL](/graphql)、
:react[[图片/二进制](../guides/img-media.md)、][Websockets+SSE](../concepts/managers.md#data-stream) 提供了可组合、可扩展的协议专用辅助工具。

要使用现有的 API 定义，或定义你自己的协议专用辅助工具，请使用
[@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint) 中的 [Endpoint](/rest/api/Endpoint) 和 [EntityMixin](/rest/api/EntityMixin)。
[参见上方的 `Async/Promise` 标签页]
