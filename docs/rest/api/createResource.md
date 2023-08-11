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
  static key = 'Todo';
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
controller.fetch(TodoResource.getList.push, {
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

Passed to [RestEndpoint.searchParams](./RestEndpoint.md#searchParams) for [getList](#getlist) and [getList.push](#push)

### body

Passed to [RestEndpoint.body](./RestEndpoint.md#body) for [getList.push](#push) [update](#update) and [partialUpdate](#partialUpdate)

### paginationField

If specified, will add [Resource.getList.getPage](#getpage) method on the `Resource`.

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

Retrieve a singular item.

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

Retrieve a list of items.

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

### getList.push {#push}

Creates a new entity and pushes it to the end of getList.

- method: 'POST'
- path: `shortenPath(path)`
- schema: `getList.schema.push`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).getList.push({ group: 'abc' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### getList.unshift {#unshift}

Creates a new entity and pushes it to the beginning of getList.

- method: 'POST'
- path: `shortenPath(path)`
- schema: `getList.schema.unshift`

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).getList.push({ group: 'abc' }, { title: 'winning' });
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### getList.getPage {#getpage}

Retrieves another [page](../guides/pagination.md#infinite-scrolling) appending to getList ensuring there are no duplicates.

- method: 'GET'
- args: `shortenPath(path) & { [paginationField]: string | number } & searchParams`
- schema: [new schema.Collection(\[schema\]).addWith(paginatedMerge, paginatedFilter(removeCursor))](./Collection.md)

```typescript
// GET //test.com/api/abc?isExtra=xyz&page=2
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
  paginationField: 'page',
}).getList.getPage({
  group: 'abc',
  isExtra: 'xyz',
  page: '2',
});
```

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### update

Update an item.

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

Update some subset of fields of an item.

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

Deletes an item.

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

### extend() {#extend}

`createResource` builds a great starting point, but often endpoints need to be [further customized](./RestEndpoint.md#typing).

`extend()` is polymorphic with three forms: 

#### Batch extension of known members

```ts
export const CommentResource = createResource({
  path: '/repos/:owner/:repo/issues/comments/:id',
  schema: Comment,
}).extend({
  getList: { path: '/repos/:owner/:repo/issues/:number/comments' },
  update: { body: { body: '' } },
});
```

#### Adding new members

```ts
export const UserResource = createGithubResource({
  path: '/users/:login',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});
```

#### Function form (to get BaseResource/super)

```ts
export const IssueResource= createResource({
  path: '/repos/:owner/:repo/issues/:number',
  schema: Issue,
  pollFrequency: 60000,
  searchParams: {} as IssueFilters | undefined,
}).extend(BaseResource => ({
  search: BaseResource.getList.extend({
    path: '/search/issues\\?q=:q?%20repo\\::owner/:repo&page=:page?',
    schema: {
      results: {
        incompleteResults: false,
        items: BaseIssueResource.getList.schema.results,
        totalCount: 0,
      },
      link: '',
    },
  })
)});
```

<StackBlitz app="github-app" file="src/resources/Comment.ts" view="editor" height={600} />

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
  type ResourceGenerics,
  type ResourceOptions,
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

export function createMyResource<O extends ResourceGenerics = any>({
  schema,
  Endpoint = AuthdEndpoint,
  ...extraOptions
}: Readonly<O> & ResourceOptions) {
  return createResource({
    Endpoint,
    schema,
    ...extraOptions,
  }).extend({
    getList: {
      schema: {
        results: new schema.Collection([schema]),
        total: 0,
        limit: 0,
        skip: 0,
      },
    },
  });
}
```

<StackBlitz app="github-app" file="src/resources/Base.ts" view="editor" height={750} />

Explore more [Reactive Data Client demos](/demos)
