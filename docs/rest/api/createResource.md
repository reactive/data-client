---
id: createResource
title: createResource
---

<head>
  <title>createResource() - Collection of CRUD Endpoints</title>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import StackBlitz from '@site/src/components/StackBlitz';

`Resources` are a collection of [RestEndpoints](./RestEndpoint.md) that operate on a common
data by sharing a [schema](./schema.md)

## Usage

```ts title="api/TodoResource.ts"
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;
  pk() {
    return this.id;
  }
}

const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```ts title="Resources start with 6 Endpoints"
const todo = useSuspense(TodoResource.get, { id: '5' });
const todos = useSuspense(TodoResource.getList);
controller.fetch(TodoResource.create, {
  title: 'finish installing reactive data client',
});
controller.fetch(
  TodoResource.update,
  { id: '5' },
  { ...todo, completed: true },
);
controller.fetch(TodoResource.partialUpdate, { id: '5' }, { completed: true });
controller.fetch(TodoResource.delete, { id: '5' });
```

## Arguments

```ts
{
  path: string;
  schema: Schema;
  urlPrefix?: string;
  body?: any;
  searchParams?: any;
  paginationField?: string;
  optimistic?: boolean;
  Endpoint?: typeof RestEndpoint;
} & EndpointExtraOptions
```

### path

Passed to [RestEndpoint.path](./RestEndpoint.md#path)

### schema

Passed to [RestEndpoint.schema](./RestEndpoint.md#schema)

### urlPrefix

Passed to [RestEndpoint.urlPrefix](./RestEndpoint.md#urlPrefix)

### searchParams

Passed to [RestEndpoint.searchParams](./RestEndpoint.md#searchParams) for [getList](#getlist) and [create](#create)

### body

Passed to [RestEndpoint.body](./RestEndpoint.md#body) for [create](#create) [update](#update) and [partialUpdate](#partialUpdate)

### paginationField

If specified, will add [Resource.getNextPage](#getnextpage) method on the `Resource`.

### optimistic

`true` makes all mutation endpoints [optimistic](../guides/optimistic-updates.md)

### Endpoint

Class used to construct the members.

### [EndpointExtraOptions](./RestEndpoint.md#endpoint-life-cycles)

## Members

These provide the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
[endpoints](./Endpoint.md)s common in [REST](https://www.restapitutorial.com/) APIs. Feel free to [customize or add
new endpoints](#customizing-resources) based to match your API.

### get

- method: 'GET'
- path: `path`
- schema: [schema](#schema)

```typescript
// GET //test.com/api/abc/xyz
createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }).get({
  group: 'abc',
  id: 'xyz',
});
```

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### getList

- method: 'GET'
- path: `shortenPath(path)`
  - Removes the last argument:
    ```ts
    createResource({ path: '/:first/:second' }).getList.path === '/:first';
    createResource({ path: '/:first' }).getList.path === '/';
    ```
- schema: [new schema.Collection(\[schema\])](./Collection.md)

```typescript
// GET //test.com/api/abc?isExtra=xyz
createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }).getList({
  group: 'abc',
  isExtra: 'xyz',
});
```

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### getNextPage

- ```getList.paginated(paginationField)```
- schema: [new schema.Collection(\[schema\]).push](./Collection.md#push)

```typescript
// GET //test.com/api/abc?isExtra=xyz&page=2
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
  paginationField: 'page',
}).getNextPage({
  group: 'abc',
  isExtra: 'xyz',
  page: '2',
});
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### create

- ```getList.push```
- method: 'POST'
- schema: `getList.schema.push`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }).create(
  { group: 'abc' },
  { title: 'winning' },
);
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### update

- method: 'PUT'
- path: `path`
- schema: `schema`

```typescript
// PUT //test.com/api/abc/xyz
// BODY { "title": "winning" }
createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }).update(
  { group: 'abc', id: 'xyz' },
  { title: 'winning' },
);
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### partialUpdate

- method: 'PATCH'
- path: `path`
- schema: `schema`

```typescript
// PATCH //test.com/api/abc/xyz
// BODY { "title": "winning" }
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).partialUpdate({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### delete

- method: 'DELETE'
- path: `path`
- schema: [new schema.Invalidate(schema)](./Invalidate.md)
- process:
  ```ts
  (value, params) {
    return value && Object.keys(value).length ? value : params;
  },
  ```

```typescript
// DELETE //test.com/api/abc/xyz
createResource({ urlPrefix: '//test.com', path: '/api/:group/:id' }).delete({
  group: 'abc',
  id: 'xyz',
});
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

## Customizing Resources

`createResource` builds a great starting point, but often endpoints need to be [further customized](./RestEndpoint.md#typing).

Overriding members with [extends()](./RestEndpoint.md#extend) makes this straightforward.

Because we are changing the endpoint types, we must use the `{...spread}` pattern rather than assignment.
This is how TypeScript is able to infer the types from our arguments.

```ts
const TodoResourceBase = createResource({
  path: '/todos/:id',
  schema: Todo,
});

export const TodoResource = {
  ...TodoResourceBase,
  getList: TodoResourceBase.getList.extend({
    searchParams: {} as { userId?: string | number } | undefined,
  }),
};
```

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts" view="editor" />

Explore more [Reactive Data Client demos](/demos)

## Function Inheritance Patterns

To reuse code around `Resource` design, you can create your own function that calls createResource().
This has similar effects as class-based inheritance.

```typescript
import {
  createResource,
  RestEndpoint,
  type EndpointExtraOptions,
  type RestGenerics,
} from '@data-client/rest';

export class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getRequestInit(body: any): RequestInit {
    return {
      ...super.getRequestInit(body),
      credentials: 'same-origin',
    };
  }
}

export function createMyResource<U extends string, S extends Schema>({
  path,
  schema,
  Endpoint = AuthdEndpoint,
  ...extraOptions
}: {
  // `readonly` is critical for the argument types to be inferred correctly
  readonly path: U;
  readonly schema: S;
  readonly Endpoint?: typeof RestEndpoint;
  urlPrefix?: string;
} & EndpointExtraOptions) {
  const BaseResource = createResource({
    path,
    Endpoint,
    schema,
    ...extraOptions,
  });

  return {
    ...BaseResource,
    getList: BaseResource.getList.extend({
      schema: { results: [schema], total: 0, limit: 0, skip: 0 },
    }),
  };
}
```

The [Github Example App](https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/github-app?file=src%2Fresources%2FBase.ts)
uses this pattern as well.
