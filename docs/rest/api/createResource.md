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
controller.fetch(
  TodoResource.partialUpdate,
  { id: '5' },
  { completed: true },
);
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
  Collection?: typeof Collection;
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

```ts
import { RestEndpoint } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getRequestInit(body: any): RequestInit {
    return {
      ...super.getRequestInit(body),
      credentials: 'same-origin',
    };
  }
}
const TodoResource = createResource({
  path: '/todos/:id',
  schema: Todo,
  // highlight-next-line
  Endpoint: AuthdEndpoint,
});
```

### Collection

[Collection Class](./Collection.md) used to construct [getList](#getlist) schema.

```ts
import { schema, createResource } from '@data-client/rest';

class MyCollection<
  S extends any[] | PolymorphicInterface = any,
  Parent extends any[] = [urlParams: any, body?: any],
> extends schema.Collection<S, Parent> {
  // getList.push should add to Collections regardless of its 'orderBy' argument
  // in other words: `orderBy` is a non-filtering argument - it does not influence which results are returned
  nonFilterArgumentKeys(key: string) {
    return key === 'orderBy';
  }
}
const TodoResource = createResource({
  path: '/todos/:id',
  searchParams: {} as
    | { userId?: string; orderBy?: string }
    | undefined,
  schema: Todo,
  // highlight-next-line
  Collection: MyCollection,
});
```

### [EndpointExtraOptions](./RestEndpoint.md#endpoint-life-cycles)

## Members

These provide the standard [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
[endpoints](./Endpoint.md)s common in [REST](https://www.restapitutorial.com/) APIs. Feel free to [customize or add
new endpoints](#customizing-resources) based to match your API.

### get

Retrieve a singular entity.

```typescript
// GET //test.com/api/abc/xyz
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).get({
  group: 'abc',
  id: 'xyz',
});
```

| Field  | Value             |
| :----: | ----------------- |
| method | 'GET'             |
|  path  | [path](#path)     |
| schema | [schema](#schema) |


Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate), [Controller.expireAll](/docs/api/Controller#expireAll)

### getList

Retrieve a list of entities.

```typescript
// GET //test.com/api/abc?isExtra=xyz
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
  searchParams: {} as { isExtra: string },
}).getList({
  group: 'abc',
  isExtra: 'xyz',
});
```

|      Field      | Value                                                |
| :-------------: | ---------------------------------------------------- |
|     method      | 'GET'                                                |
|      path       | removeLastArg([path](#path))                         |
|  searchParams   | [searchParams](#searchparams)                        |
| paginationField | [paginationField](#paginationfield)                  |
|     schema      | [new schema.Collection(\[schema\])](./Collection.md) |

<!-- prettier-ignore-start -->
```ts
createResource({ path: '/:first/:second' }).getList.path === '/:first';
createResource({ path: '/:first' }).getList.path === '/';
```
<!-- prettier-ignore-end -->

Commonly used with [useSuspense()](/docs/api/useSuspense), [Controller.invalidate](/docs/api/Controller#invalidate), [Controller.expireAll](/docs/api/Controller#expireAll)

### getList.push {#push}

[RestEndpoint.push](./RestEndpoint.md#push) creates a new entity and pushes it to the end of getList.

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).getList.push({ group: 'abc' }, { title: 'winning' });
```

|    Field     | Value                                       |
| :----------: | ------------------------------------------- |
|    method    | 'POST'                                      |
|     path     | removeLastArg([path](#path))                |
| searchParams | [searchParams](#searchparams)               |
|     body     | [body](#body)                               |
|    schema    | getList.[schema.push](./Collection.md#push) |


Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### getList.unshift {#unshift}

[RestEndpoint.unshift](./RestEndpoint.md#unshift) creates a new entity and pushes it to the beginning of getList.

```typescript
// POST //test.com/api/abc
// BODY { "title": "winning" }
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).getList.push({ group: 'abc' }, { title: 'winning' });
```

|    Field     | Value                                             |
| :----------: | ------------------------------------------------- |
|    method    | 'POST'                                            |
|     path     | removeLastArg([path](#path))                      |
| searchParams | [searchParams](#searchparams)                     |
|     body     | [body](#body)                                     |
|    schema    | getList.[schema.unshift](./Collection.md#unshift) |


Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### getList.getPage {#getpage}

[RestEndpoint.getPage](./RestEndpoint.md#getpage) retrieves another [page](../guides/pagination.md#infinite-scrolling) appending to getList ensuring there are no duplicates.

This member is only available when [paginationField](#paginationfield) is specified.

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

|      Field      | Value                                               |
| :-------------: | --------------------------------------------------- |
|     method      | 'GET'                                               |
|      path       | removeLastArg([path](#path))                        |
|  searchParams   | [searchParams](#searchparams)                       |
| paginationField | [paginationField](#paginationfield)                 |
|     schema      | [getList.schema.addWith](./RestEndpoint.md#getpage) |

args: `PathToArgs(shortenPath(path)) & searchParams & \{ [paginationField]: string | number \}`


Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### update

Update an entity.

```typescript
// PUT //test.com/api/abc/xyz
// BODY { "title": "winning" }
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).update({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

| Field  | Value             |
| :----: | ----------------- |
| method | 'PUT'             |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |


Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### partialUpdate

Update some subset of fields of an entity.

```typescript
// PATCH //test.com/api/abc/xyz
// BODY { "title": "winning" }
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).partialUpdate({ group: 'abc', id: 'xyz' }, { title: 'winning' });
```

| Field  | Value             |
| :----: | ----------------- |
| method | 'PATCH'           |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

### delete

Deletes an entity.

```typescript
// DELETE //test.com/api/abc/xyz
createResource({
  urlPrefix: '//test.com',
  path: '/api/:group/:id',
}).delete({
  group: 'abc',
  id: 'xyz',
});
```

<table>
<tr>
<th>method</th><td>'DELETE'</td>
</tr>
<tr>
<th>path</th><td>[path](#path)</td>
</tr>
<tr>
<th>schema</th><td>[new schema.Invalidate(schema)](./Invalidate.md)</td>
</tr>
<tr>
<th>process</th>
<td>

```ts
(value, params) {
  return value && Object.keys(value).length ? value : params;
},
```

</td>
</tr>
</table>

Commonly used with [Controller.fetch](/docs/api/Controller#fetch)

#### Response

```json
{ "id": "xyz" }
```

Response should either be the [pk](./Entity.md#pk) as a string (like `'xyz'`). Or an object with the members needed to compute
[Entity.pk](./Entity.md#pk) (like `{id: 'xyz'}`).

If no response is provided, the `process` implementation will attempt to use the url parameters sent as an object to compute
the [Entity.pk](./Entity.md#pk). This enables the default implementation to still work with no response, so long as standard
arguments are used.

This allows [schema.Invalidate](./Invalidate.md) to remove the entity from the [entity table](/docs/concepts/normalization)

### extend() {#extend}

`createResource` builds a great starting point, but often endpoints need to be [further customized](./RestEndpoint.md#typing).

`extend()` is polymorphic with three forms:

#### Batch extension of known members {#extend-override}

```ts
export const CommentResource = createResource({
  path: '/repos/:owner/:repo/issues/comments/:id',
  schema: Comment,
}).extend({
  getList: { path: '/repos/:owner/:repo/issues/:number/comments' },
  update: { body: { body: '' } },
});
```

#### Adding new members {#extend-new}

```ts
export const UserResource = createGithubResource({
  path: '/users/:login',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});
```

#### Function form (to get BaseResource/super) {#extend-function}

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

<StackBlitz app="github-app" file="src/pages/IssueDetail/CommentsList.tsx,src/resources/Comment.ts" initialpath="/reactjs/rfcs/issue/68" view="editor" height={600} />

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
