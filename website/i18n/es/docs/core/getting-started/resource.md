---
title: Definición de Resources para Reactive Data Client
sidebar_label: Definir datos
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

# Definir Resources

Los [Resources](/rest/api/resource) son una colección de `methods` para un `data model` dado.

Las [Entities](/rest/api/Entity) y los [Schemas](/rest/api/schema) definen de forma declarativa el [_modelo de datos_](../concepts/normalization.md).
Los [Endpoints](/rest/api/Endpoint) son los [_métodos_](<https://en.wikipedia.org/wiki/Method_(computer_programming)>) sobre
esos datos.

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



[resource()](/rest/api/resource) construye un espacio de nombres de [RestEndpoints](/rest/api/RestEndpoint)

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

[GQLEndpoint](/graphql/api/GQLEndpoint) ayuda a definir rápidamente [queries](/graphql/api/GQLEndpoint#query) y [mutaciones](/graphql/api/GQLEndpoint#mutate)

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

Las definiciones de TypeScript preexistentes se pueden usar en <abbr title="Reactive Data Client">Data Client</abbr> con
[Endpoint](/rest/api/Endpoint) y [EntityMixin](/rest/api/EntityMixin).

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

Para ayudarte a definir `Resources`, se proporcionan helpers componibles y extensibles específicos de cada protocolo para [REST](/rest), [GraphQL](/graphql),
:react[[Image/binary](../guides/img-media.md), ][Websockets+SSE](../concepts/managers.md#data-stream).

Para usar definiciones de API existentes, o definir tus propios helpers específicos de un protocolo, usa
[Endpoint](/rest/api/Endpoint) y [EntityMixin](/rest/api/EntityMixin) de [@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint).
[Consulta la pestaña `Async/Promise` de arriba]
