---
id: createResource
title: createResource
---

<head>
  <title>createResource() - Collection of CRUD API operations</title>
</head>


import LanguageTabs from '@site/src/components/LanguageTabs';

`Resources` are a collection of [RestEndpoints](./RestEndpoint.md) that operate on a common
data by sharing a [schema](./schema.md)

## Usage

```ts title="api/TodoResource.ts"
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;
  pk() { return this.id }
}

const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```ts
const todo = useSuspense(TodoResource.get, { id: '5' });
const todos = useSuspense(TodoResource.getList);
controller.fetch(TodoResource.create, { title: 'finish installing rest hooks' })
controller.fetch(TodoResource.update, { id: '5' }, { ...todo, completed: true })
controller.fetch(TodoResource.partialUpdate, { id: '5' }, { completed: true })
controller.fetch(TodoResource.delete, { id: '5' })
```

## Arguments

```ts
{
  path: string;
  schema: Schema;
  Endpoint?: typeof RestEndpoint;
  urlPrefix?: string;
} & EndpointExtraOptions
```

### path

Passed to [RestEndpoint.path](./RestEndpoint.md#path)

### schema

Passed to [RestEndpoint.schema](./RestEndpoint.md#schema)

### urlPrefix

Passed to [RestEndpoint.urlPrefix](./RestEndpoint.md#urlPrefix)

### Endpoint

Class used to construct the members.

### [EndpointExtraOptions](./RestEndpoint.md#endpoint-life-cycles)

## Members

These provide the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
[endpoints](./Endpoint.md)s common in [REST](https://www.restapitutorial.com/) APIs. Feel free to customize or add
new endpoints based to match your API.

### get

- method: 'GET'
- path: `path`
- schema: `schema`

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### getList

- method: 'GET'
- path: `shortenPath(path)`
  - Removes the last argument:
    ```ts
    createResource({path: '/:first/:second'}).getList.path === '/:first'
    createResource({path: '/:first'}).getList.path === '/'
    ```
- schema: `[schema]`

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate)

### create

- method: 'POST'
- path: `shortenPath(path)`
  - Removes the last argument:
    ```ts
    createResource({path: '/:first/:second'}).getList.path === '/:first'
    createResource({path: '/:first'}).create.path === '/'
    ```
- schema: `schema`

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### update

- method: 'PUT'
- path: `path`
- schema: `schema`

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### partialUpdate

- method: 'PATCH'
- path: `path`
- schema: `schema`

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### delete

- method: 'DELETE'
- path: `path`
- schema: `new schema.Delete(schema)`
- process:
    ```ts
    (value, params) {
      return value && Object.keys(value).length ? value : params;
    },
    ```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

