---
title: Define API Endpoints
sidebar_label: Define API
---

<head>
  <title>Define API for Rest Hooks</title>
</head>

import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import ProtocolTabs from '@site/src/components/ProtocolTabs';
import PkgInstall from '@site/src/components/PkgInstall';

`Endpoints` are the _methods_ of your data. `Schemas` define the data model. `Resources` are
a collection of `endpoints` around one `schema`.

<Tabs
defaultValue="rest"
groupId="protocol"
values={[
{ label: 'Rest', value: 'rest' },
{ label: 'GraphQL', value: 'gql' },
]}
>
<TabItem value="rest">

  <PkgInstall pkgs="@rest-hooks/rest" />

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

export const TodoResource = new createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

  </TabItem>
  <TabItem value="gql">

  <PkgInstall pkgs="@rest-hooks/graphql" />

```typescript title="api/Todo.ts"
import { GQLEndpoint, GQLEntity } from '@rest-hooks/graphql';

const gql = new GQLEndpoint('/');

export class Todo extends GQLEntity {
  readonly title: string = '';
  readonly completed: boolean = false;
}

export const todoList = gql.query(
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
);

export const updateTodo = gql.mutation(
  `mutation UpdateTodo($todo: Todo!) {
    updateTodo(todo: $todo) {
      id
      title
      completed
    }
  }`,
  { updateTodo: Todo },
);
```

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
