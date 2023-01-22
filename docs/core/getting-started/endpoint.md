---
title: Define Async Methods (Endpoints)
sidebar_label: Define Methods
---

<head>
  <title>Defining Asynchronous Methods (Endpoints) for Rest Hooks</title>
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

[Endpoints](/rest/api/RestEndpoint) are the [_methods_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>) of your data. [Schemas](../concepts/normalization.md) define the data model. [Resources](/rest/api/createResource) are
a collection of `endpoints` around one `schema`.

<Tabs
defaultValue="rest"
groupId="protocol"
values={[
{ label: 'Rest', value: 'rest' },
{ label: 'GraphQL', value: 'gql' },
{ label: 'Promise', value: 'other' },
]}>
<TabItem value="rest">

  <PkgInstall pkgs="@rest-hooks/rest" />

<TypeScriptEditor row={false}>

```typescript title="api/Todo.ts"
import { createResource, Entity } from '@rest-hooks/rest';

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
  schema: Todo,
});
```

```typescript title="Six_Methods" collapsed
import { TodoResource } from './api/Todo';

// GET https://jsonplaceholder.typicode.com/todos/5
TodoResource.get({ id: 5 });
// GET https://jsonplaceholder.typicode.com/todos
TodoResource.getList();
// POST https://jsonplaceholder.typicode.com/todos
TodoResource.create({ title: 'my todo' });
// PUT https://jsonplaceholder.typicode.com/todos/5
TodoResource.update({ id: 5 }, { title: 'my todo' });
// PATCH https://jsonplaceholder.typicode.com/todos/5
TodoResource.partialUpdate({ id: 5 }, { title: 'my todo' });
// DELETE https://jsonplaceholder.typicode.com/todos/5
TodoResource.delete({ id: 5 });
```

</TypeScriptEditor>

  </TabItem>
  <TabItem value="gql">

  <PkgInstall pkgs="@rest-hooks/graphql" />

<TypeScriptEditor row={false}>

```typescript title="api/Todo.ts"
import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  readonly title: string = '';
  readonly completed: boolean = false;
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
    { todos: [Todo] },
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

  <PkgInstall pkgs="@rest-hooks/endpoint" />

<TypeScriptEditor row={false}>

```typescript title="api/Todo.ts"
import { Entity, Endpoint } from '@rest-hooks/endpoint';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;

  pk() {
    return `${this.id}`;
  }
}

export const TodoResource = {
  getList: new Endpoint(
    () =>
      fetch('https://jsonplaceholder.typicode.com/todos').then(res =>
        res.json(),
      ),
    {
      schema: [Todo],
    },
  ),
  update: new Endpoint(
    (id: string, body: Partial<Todo>) =>
      fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }).then(res => res.json()),
    {
      schema: Todo,
      sideEffect: true,
    },
  ),
};
```

</TypeScriptEditor>

  </TabItem>
</Tabs>

<!--
  <TabItem value="sse">

```ts
import type { Manager, Middleware } from '@rest-hooks/core';
import type { EndpointInterface } from '@rest-hooks/endpoint';

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

<PkgInstall pkgs="@rest-hooks/img" />

</TabItem>
-->

It's highly encouraged to design APIs with consistent patterns. Because of this,
you can extend our protocol specific helpers. After choosing your protocol, you can
read up on the full docs for reach protocol [REST](/rest), [GraphQL](/graphql),
[Image/binary](../guides/img-media.md), [Websockets+SSE](../api/Manager.md#middleware-data-stream)
