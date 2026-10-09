---
id: resource
title: 大规模定义 TypeScript REST API 资源
sidebar_label: resource
description: Resource 是一组 RestEndpoint 的集合，它们通过共享同一个 schema 来操作共同的数据
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import StackBlitz from '@site/src/components/StackBlitz';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import DeleteProcess from './\_DeleteProcess.mdx';

# Resource

`Resources` 是一组 [RestEndpoints](./RestEndpoint.md) 的集合，它们通过共享同一个 [schema](./schema.md)
来操作共同的数据

## 用法 {#usage}

```ts title="resources/Todo.ts"
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;

  static key = 'Todo';
}

const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

:::react

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

:::

:::vue

```ts title="Resources start with 6 Endpoints"
const todo = await useSuspense(TodoResource.get, { id: '5' });
const todos = await useSuspense(TodoResource.getList);
controller.fetch(TodoResource.getList.push, {
  title: 'finish installing reactive data client',
});
controller.fetch(
  TodoResource.update,
  { id: '5' },
  { ...todo.value, completed: true },
);
controller.fetch(
  TodoResource.partialUpdate,
  { id: '5' },
  { completed: true },
);
controller.fetch(TodoResource.delete, { id: '5' });
```

:::

## 参数 {#arguments}

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

### path {#path}

传给单条目 [endpoint](#members) 的 [RestEndpoint.path](./RestEndpoint.md#path)。
使用 [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp) 语法——关于
[可选参数](./RestEndpoint.md#path)、[通配符](./RestEndpoint.md#path)、
[带引号的名称](./RestEndpoint.md#path)和[转义](./RestEndpoint.md#path)的完整说明，
请参阅 [RestEndpoint.path](./RestEndpoint.md#path)。

创建类（[getList.push](#push)/[getList.unshift](#unshift)）和 [getList](#getlist) 会移除最后一个 `:param` 或 `*wildcard` token。

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
});

// GET /react/posts/abc
PostResource.get({ group: 'react', id: 'abc' });
// PATCH /react/posts/abc
PostResource.partialUpdate({ group: 'react', id: 'abc' }, { title: 'This new title' });
// GET /react/posts
PostResource.getList({ group: 'react' });
```

可选参数使用 `{}` 语法：

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts{/:id}',
});

PostResource.get({ group: 'react', id: 'abc' });
PostResource.getList({ group: 'react' });
```

也支持将通配符参数作为最后一个 token：

```ts
const FileResource = resource({
  schema: File,
  path: '/repos/:owner/*path',
});

// GET /repos/john/src/index.ts
FileResource.get({ owner: 'john', path: ['src', 'index.ts'] });
// GET /repos/john
FileResource.getList({ owner: 'john' });
```

### schema {#schema}

传给 [RestEndpoint.schema](./RestEndpoint.md#schema)，表示单个条目。它通常是
一个 [Entity](./Entity.md) 或 [Union](./Union.md)。

- [getList](#getlist) 使用该 schema 的 [Array](./Array.md) [Collection](./Collection.md)。
- [delete](#delete) 使用该 schema 的 [Invalidate](./Invalidate.md)。

### urlPrefix {#urlprefix}

传给 [RestEndpoint.urlPrefix](./RestEndpoint.md#urlPrefix)

### searchParams {#searchparams}

传给 [getList](#getlist) 和 [getList.push](#push) 的 [RestEndpoint.searchParams](./RestEndpoint.md#searchParams)

### body {#body}

传给 [getList.push](#push)、[update](#update) 和 [partialUpdate](#partialupdate) 的 [RestEndpoint.body](./RestEndpoint.md#body)

### paginationField {#paginationfield}

如果指定，会在 `Resource` 上添加 [Resource.getList.getPage](#getpage) 方法。

### nonFilterArgumentKeys {#nonfilterargumentkeys}

透传给 [getList](#getlist) schema 的
[Collection.nonFilterArgumentKeys](./Collection.md#nonFilterArgumentKeys) 选项。

```ts
const PostResource = resource({
  path: '/:group/posts/:id',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: Post,
  nonFilterArgumentKeys: ['orderBy'],
});
```

也支持 `RegExp` 和函数形式：

```ts
resource({
  path: '/:group/posts/:id',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: Post,
  nonFilterArgumentKeys: /orderBy/,
});
```

### optimistic {#optimistic}

设为 `true` 会让所有变更 endpoint 都变为[乐观的](../guides/optimistic-updates.md)，使 <abbr title="User Interface">UI</abbr>
立即更新，甚至无需等待请求完成。

### Endpoint {#endpoint}

用于构造各个成员的类。

```ts
import { RestEndpoint } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...(await super.getRequestInit(body)),
      credentials: 'same-origin',
    };
  }
}
const TodoResource = resource({
  path: '/todos/:id',
  schema: Todo,
  // highlight-next-line
  Endpoint: AuthdEndpoint,
});
```

### Collection {#collection}

用于构造 [getList](#getlist) schema 的 [Collection 类](./Collection.md)。
当你需要在 [`nonFilterArgumentKeys`](#nonfilterargumentkeys) 之外进一步自定义 collection 的行为时
（例如更改 move 的合并逻辑），请使用它。

```ts
import { resource, Collection, unshift } from '@data-client/rest';

class MyCollection<
  S extends any[] | PolymorphicInterface = any,
  Parent extends any[] = [urlParams: any, body?: any],
> extends Collection<S, Parent> {
  constructor(schema: S) {
    super(schema);
    // prepend moved items instead of appending
    this.move = this.moveWith(unshift);
  }
}
const TodoResource = resource({
  path: '/todos/:id',
  searchParams: {} as { userId?: string; orderBy?: string } | undefined,
  schema: Todo,
  // highlight-next-line
  Collection: MyCollection,
});
```

### [EndpointExtraOptions](./RestEndpoint.md#dataexpirylength) {#endpointextraoptions}

包括 dataExpiryLength、errorExpiryLength、errorPolicy、invalidIfStale 和 pollFrequency

## 成员 {#members}

这些成员提供了 [REST](https://www.restapitutorial.com/) API 中常见的标准 [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)
[endpoint](./Endpoint.md)。你可以根据自己的 API 随意[自定义或添加
新的 endpoint](#extend-new)。

```ts
const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
  paginationField: 'page',
});
```

| 名称                        | 方法                                                                     | 参数                                                | Schema                                                |
| --------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| [get](#get)                 | [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)       | `[{group: string; id: string}]`                     | [Post](./Entity.md)                                   |
| [getList](#getlist)         | [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)       | `[{group: string; author?: string}]`                | [Collection([Post])](./Collection.md)                 |
| [getList.push](#push)       | [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)     | `[{group: string; author?: string}, Partial<Post>]` | [Collection([Post]).push](./Collection.md#push)       |
| [getList.unshift](#unshift) | [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)     | `[{group: string; author?: string}, Partial<Post>]` | [Collection([Post]).unshift](./Collection.md#unshift) |
| [getList.getPage](#getpage) | [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET)       | `[{group: string; author?: string; page: string}]`  | [Collection([Post]).addWith](./Collection.md#addWith) |
| [getList.move](#move)       | [PATCH](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH)   | `[{group: string; id: string }, Partial<Post>]`     | [Collection([Post]).move](./Collection.md#move)       |
| [update](#update)           | [PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT)       | `[{group: string; id: string }, Partial<Post>]`     | [Post](./Entity.md)                                   |
| [partialUpdate](#update)    | [PATCH](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH)   | `[{group: string; id: string }, Partial<Post>]`     | [Post](./Entity.md)                                   |
| [delete](#delete)           | [DELETE](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE) | `[{group: string; id: string }]`                    | [Invalidate(Post)](./Invalidate.md)                   |

### get {#get}

获取单个 Entity。

<EndpointPlayground input="/react/posts/1" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={{  "id": "1","group": "react","title": "this post",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.get({
  group: 'react',
  id: '1',
});
```

</EndpointPlayground>

| 字段  | 值             |
| :----: | ----------------- |
| method | 'GET'             |
|  path  | [path](#path)     |
| schema | [schema](#schema) |

通常与 [useSuspense()](/docs/api/useSuspense)、[Controller.invalidate](/docs/api/Controller#invalidate)、[Controller.expireAll](/docs/api/Controller#expireAll) 一起使用

### getList {#getlist}

获取 Entity 列表。

<EndpointPlayground input="/react/posts?author=clara" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={[{ "id": "1","group": "react","title": "this post",author: 'clara',}]}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList({
  group: 'react',
  author: 'clara',
});
```

</EndpointPlayground>

|      字段      | 值                                                |
| :-------------: | ---------------------------------------------------- |
|     method      | 'GET'                                                |
|      path       | removeLastArg([path](#path))                         |
|  searchParams   | [searchParams](#searchparams)                        |
| paginationField | [paginationField](#paginationfield)                  |
|     schema      | [new Collection(\[schema\])](./Collection.md) |

<!-- prettier-ignore-start -->
```ts
resource({ path: '/:first/:second' }).getList.path === '/:first';
resource({ path: '/:first' }).getList.path === '/';
resource({ path: '/:owner/*path' }).getList.path === '/:owner';
```
<!-- prettier-ignore-end -->

通常与 [useSuspense()](/docs/api/useSuspense)、[Controller.invalidate](/docs/api/Controller#invalidate)、[Controller.expireAll](/docs/api/Controller#expireAll) 一起使用

### getList.push {#push}

[RestEndpoint.push](./RestEndpoint.md#push) 会创建一个新的 Entity，并将其添加到 getList 的末尾。如果想放在开头，
请改用 [getList.unshift](#unshift)。将数组作为 body 传入即可一次创建多个。

<EndpointPlayground input="/react/posts?author=clara" init={{method: 'POST', headers: {'Content-Type': 'application/json'},body: JSON.stringify({ "title": "winning" })}} status={201} response={{  "id": "2","group": "react","title": "winning",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.push(
  { group: 'react', author: 'clara' },
  { title: 'winning' },
);
```

</EndpointPlayground>

|    字段     | 值                                       |
| :----------: | ------------------------------------------- |
|    method    | 'POST'                                      |
|     path     | removeLastArg([path](#path))                |
| searchParams | [searchParams](#searchparams)               |
|     body     | [body](#body)                               |
|    schema    | getList.[schema.push](./Collection.md#push) |

通常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### getList.unshift {#unshift}

[RestEndpoint.unshift](./RestEndpoint.md#unshift) 会创建一个新的 Entity，并将其添加到 getList 的开头。

<EndpointPlayground input="/react/posts?author=clara" init={{method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "title": "winning" })}} status={201} response={{  "id": "2","group": "react","title": "winning",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.unshift(
  { group: 'react', author: 'clara' },
  { title: 'winning' },
);
```

</EndpointPlayground>

|    字段     | 值                                             |
| :----------: | ------------------------------------------------- |
|    method    | 'POST'                                            |
|     path     | removeLastArg([path](#path))                      |
| searchParams | [searchParams](#searchparams)                     |
|     body     | [body](#body)                                     |
|    schema    | getList.[schema.unshift](./Collection.md#unshift) |

通常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### getList.getPage {#getpage}

[RestEndpoint.getPage](./RestEndpoint.md#getpage) 会获取另一[页](../guides/pagination.md#infinite-scrolling)数据并追加到 getList 中，同时确保没有重复项。

只有指定了 [paginationField](#paginationfield) 时才会提供此成员。

<EndpointPlayground input="/react/posts?author=clara&page=2" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={[{ "id": "5","group": "react","title": "second page",author: 'clara',}]}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
  paginationField: 'page',
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.getPage({
  group: 'react',
  author: 'clara',
  page: 2,
});
```

</EndpointPlayground>

|      字段      | 值                                               |
| :-------------: | --------------------------------------------------- |
|     method      | 'GET'                                               |
|      path       | removeLastArg([path](#path))                        |
|  searchParams   | [searchParams](#searchparams)                       |
| paginationField | [paginationField](#paginationfield)                 |
|     schema      | [getList.schema.addWith](./Collection.md#addWith) |

args: `PathToArgs(shortenPath(path)) & searchParams & \{ [paginationField]: string | number \}`

通常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### getList.move {#move}

[RestEndpoint.move](./RestEndpoint.md#move) 会在 [Collections](./Collection.md) 之间移动 Entity：将其从
与旧状态匹配的 collection 中移除，并添加到与 body 中新值相匹配的 collection 中。

<EndpointPlayground input="/react/posts/1" init={{method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "group": "vue" })}} status={200} response={{  "id": "1","group": "vue","title": "this post",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.getList.move(
  { group: 'react', id: '1' },
  { group: 'vue' },
);
```

</EndpointPlayground>

|    字段     | 值                                       |
| :----------: | ------------------------------------------- |
|    method    | 'PATCH'                                     |
|     path     | [path](#path)                               |
|     body     | [body](#body)                               |
|    schema    | getList.[schema.move](./Collection.md#move) |

通常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### update {#update}

更新一个 Entity。

<EndpointPlayground input="/react/posts/1" init={{method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "title": "updated title", author: 'clara' })}} status={200} response={{  "id": "1","group": "react","title": "updated title",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.update(
  { group: 'react', id: '1' },
  { title: 'updated title', author: 'clara' },
);
```

</EndpointPlayground>

| 字段  | 值             |
| :----: | ----------------- |
| method | 'PUT'             |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |

通常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### partialUpdate {#partialupdate}

更新 Entity 的部分字段。

<EndpointPlayground input="/react/posts/1" init={{method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ "title": "updated title" })}} status={200} response={{  "id": "1","group": "react","title": "updated title",author: 'clara',}}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.partialUpdate(
  { group: 'react', id: '1' },
  { title: 'updated title' },
);
```

</EndpointPlayground>

| 字段  | 值             |
| :----: | ----------------- |
| method | 'PATCH'           |
|  path  | [path](#path)     |
|  body  | [body](#body)     |
| schema | [schema](#schema) |

通常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

### delete {#delete}

删除一个 Entity。

<EndpointPlayground input="/react/posts/1" init={{method: 'DELETE', headers: {'Content-Type': 'application/json', }}} status={200} response={{ "id": "1" }}>

```typescript title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
```

```typescript title="Resource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  schema: Post,
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
});
```

```typescript title="Usage" column
import { PostResource } from './Resource';
PostResource.delete({ group: 'react', id: '1' });
```

</EndpointPlayground>

|  字段  | 值                                            |
| :-----: | ------------------------------------------------ |
| method  | 'DELETE'                                         |
|  path   | [path](#path)                                    |
| schema  | [new Invalidate(schema)](./Invalidate.md) |
| process | <DeleteProcess />                                |

通常与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用

#### 响应 {#response}

```json
{ "id": "xyz" }
```

响应应当是字符串形式的 [pk](./Entity.md#pk)（例如 `'xyz'`），或者是一个包含计算
[Entity.pk](./Entity.md#pk) 所需成员的对象（例如 `{id: 'xyz'}`）。

如果没有提供响应，`process` 的实现会尝试使用作为对象发送的 url 参数来计算
[Entity.pk](./Entity.md#pk)。这样，只要使用的是标准参数，即使没有响应，
默认实现也依然可以正常工作。

这使得 [Invalidate](./Invalidate.md) 能够将该 Entity 从 [Entity 表](/docs/concepts/normalization)中移除

### extend() {#extend}

`resource` 提供了一个很好的起点，但 endpoint 往往还需要[进一步自定义](./RestEndpoint.md#typing)。

`extend()` 是多态的，有三种形式：

#### 函数形式（用于获取 BaseResource/super） {#extend-function}

这种形式最灵活，但也最冗长。

```ts
export const IssueResource= resource({
  path: '/repos/:owner/:repo/issues/:number',
  schema: Issue,
  pollFrequency: 60000,
  searchParams: {} as IssueFilters | undefined,
}).extend(BaseResource => ({
  search: BaseResource.getList.extend({
    path: '/search/issues?{q=:q}%20repo\\::owner/:repo{&page=:page}',
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

#### 批量扩展已有成员 {#extend-override}

这种形式只适用于已有的成员。

```ts
export const CommentResource = resource({
  path: '/repos/:owner/:repo/issues/comments/:id',
  schema: Comment,
}).extend({
  getList: { path: '/repos/:owner/:repo/issues/:number/comments' },
  update: { body: { body: '' } },
});
```

#### 添加新成员 {#extend-new}

这种形式一次只能添加一个 endpoint。

```ts
export const UserResource = createGithubResource({
  path: '/users/:login',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});
```


#### Github CommentResource {#github-commentresource}

<StackBlitz app="github-app" file="src/pages/IssueDetail/CommentsList.tsx,src/resources/Comment.ts" initialpath="/reactjs/rfcs/issue/68" view="editor" height={600} />

## 函数继承模式 {#function-inheritance-patterns}

要复用与 `Resource` 定义相关的代码，你可以创建自己的函数来调用 resource()。
这与基于类的继承效果类似，而且还有一个额外的好处：允许完全
覆盖类型。

```typescript
import {
  resource,
  RestEndpoint,
  Collection,
  type EndpointExtraOptions,
  type RestGenerics,
  type ResourceGenerics,
  type ResourceOptions,
} from '@data-client/rest';

export class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = process.env.API_SERVER ?? 'http://localhost:8000';

  async getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...(await super.getRequestInit(body)),
      credentials: 'same-origin',
    };
  }
}

export function myResource<O extends ResourceGenerics = any>({
  schema,
  Endpoint = AuthdEndpoint,
  ...extraOptions
}: Readonly<O> & ResourceOptions) {
  return resource({
    Endpoint,
    schema,
    ...extraOptions,
  }).extend({
    getList: {
      schema: {
        results: new Collection([schema]),
        total: 0,
        limit: 0,
        skip: 0,
      },
    },
  });
}
```

### GraphQL + REST Hybrid {#graphql--rest-hybrid}

当你的 API 同时提供 REST 和 GraphQL endpoint 时，可以在同一个 resource 中混合使用它们。
使用 [Entity.process()](/rest/api/Entity#process) 来规范化不同形态的响应。

```typescript
import { GQLEndpoint } from '@data-client/graphql';
import { Entity, resource } from '@data-client/rest';

const gql = new GQLEndpoint('https://api.myservice.com/graphql');

export class Repository extends Entity {
  id = '';
  name = '';
  owner = { login: '' };
  stargazersCount = 0;
  forksCount = 0;

  pk() {
    return `${this.owner.login}/${this.name}`;
  }

  static key = 'Repository';
}

/** Normalizes GraphQL response shape to match REST Entity */
export class GqlRepository extends Repository {
  static process(input: any, parent: any, key: string | undefined) {
    // GraphQL uses different field names than REST
    if ('stargazerCount' in input) {
      return {
        ...input,
        stargazersCount: input.stargazerCount,
        forksCount: input.forkCount,
      };
    }
    return input;
  }
}

export const RepositoryResource = resource({
  path: '/repos/:owner/:repo',
  schema: Repository,
}).extend(base => ({
  // REST endpoint for single repo
  get: base.get,
  // GraphQL endpoint for user's pinned repos
  getByPinned: gql.query(
    (v: { login: string }) => `query ($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              id
              name
              owner { login }
              stargazerCount
              forkCount
            }
          }
        }
      }
    }`,
    { user: { pinnedItems: { nodes: [GqlRepository] } } },
  ),
}));
```

#### Github 示例 {#github-example}

<StackBlitz app="github-app" file="src/resources/Base.ts" view="editor" height={750} />
