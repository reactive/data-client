---
title: RestEndpoint - 基于路径的强类型 HTTP API 定义
sidebar_label: RestEndpoint
description: 基于路径、强类型且可扩展的 HTTP API 定义。
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import Grid from '@site/src/components/Grid';
import Link from '@docusaurus/Link';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';

# RestEndpoint

`RestEndpoints` 适用于 REST 等基于 [HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) 的协议。

:::info extends

`RestEndpoint` 继承自 [Endpoint](./Endpoint.md)

:::

<details>
<summary><b>接口</b></summary>

<Tabs
defaultValue="RestEndpoint"
values={[
{ label: 'RestEndpoint', value: 'RestEndpoint' },
{ label: 'Endpoint', value: 'Endpoint' },
]}>
<TabItem value="RestEndpoint">

```typescript
interface RestGenerics {
  readonly path: string;
  readonly schema?: Schema | undefined;
  readonly method?: string;
  readonly body?: any;
  readonly searchParams?: any;
  readonly paginationField?: string;
  readonly content?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream';
  process?(value: any, ...args: any): any;
}

export class RestEndpoint<O extends RestGenerics = any> extends Endpoint {
  /* Prepare fetch */
  readonly path: string;
  readonly urlPrefix: string;
  readonly requestInit: RequestInit;
  readonly method: string;
  readonly paginationField?: string;
  readonly content?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream';
  readonly signal: AbortSignal | undefined;
  url(...args: Parameters<F>): string;
  searchToString(searchParams: Record<string, any>): string;
  getRequestInit(
    this: any,
    body?: RequestInit['body'] | Record<string, unknown>,
  ): Promise<RequestInit> | RequestInit;
  getHeaders(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;

  /* Perform/process fetch */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  parseResponse(response: Response): Promise<any>;
  process(value: any, ...args: Parameters<F>): any;

  testKey(key: string): boolean;
}
```

</TabItem>
<TabItem value="Endpoint">

```typescript
class Endpoint<F extends (...args: any) => Promise<any>> {
  constructor(fetchFunction: F, options: EndpointOptions);

  key(...args: Parameters<F>): string;

  readonly sideEffect?: true;

  readonly schema?: Schema;

  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in milliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly getOptimisticResponse?: (
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ) => ResolveType<F>;
  /** Determines whether to throw or fallback to */
  readonly errorPolicy?: (error: any) => 'soft' | undefined;

  testKey(key: string): boolean;
}
```

</TabItem>
</Tabs>

</details>

## 用法 {#usage}

所有选项都可以作为构造函数和 [extend](#extend) 的参数传入，也可以在使用[继承](#inheritance)时作为覆盖项

### 最简单的获取 {#simplest-retrieval}

<Grid>

```ts
const getTodo = new RestEndpoint({
  path: '/todos/:id',
});
```

```ts
const todo = await getTodo({ id: 1 });
```

</Grid>

### 共享配置 {#configuration-sharing}

请使用 [RestEndpoint.extend()](#extend)，而不是 `{...getTodo}`（[对象展开](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals)）

```ts
const updateTodo = getTodo.extend({ method: 'PUT' });
```

### 管理状态 {#managing-state}

<TypeScriptEditor>

```ts path=Todo.ts
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;
}

export const getTodo = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
export const updateTodo = getTodo.extend({ method: 'PUT' });
```

</TypeScriptEditor>

使用 [Schema](./schema.md) 可以实现[自动的数据一致性](/docs/concepts/normalization)，而无需通过[重新获取](/docs/api/Controller#expireAll)来牺牲性能。

### 类型 {#typing}

<TypeScriptEditor>

```ts title="Comment" collapsed
export class Comment extends Entity {
  id = '';
  title = '';
  body = '';
  postId = '';

  static key = 'Comment';
}
```

:::react

```ts title="Usage"
import { Comment } from './Comment';

const getComments = new RestEndpoint({
  path: '/posts/:postId/comments',
  schema: new Collection([Comment]),
  searchParams: {} as { sortBy?: 'votes' | 'recent' } | undefined,
});

// Hover your mouse over 'comments' to see its type
const comments = useSuspense(getComments, {
  postId: '5',
  sortBy: 'votes',
});

const ctrl = useController();
const createComment = async data =>
  ctrl.fetch(getComments.push, { postId: '5' }, data);
```

:::

:::vue

```ts title="Usage"
import { Comment } from './Comment';

const getComments = new RestEndpoint({
  path: '/posts/:postId/comments',
  schema: new Collection([Comment]),
  searchParams: {} as { sortBy?: 'votes' | 'recent' } | undefined,
});

// Hover your mouse over 'comments' to see its type
const comments = await useSuspense(getComments, {
  postId: '5',
  sortBy: 'votes',
});

const ctrl = useController();
const createComment = async data =>
  ctrl.fetch(getComments.push, { postId: '5' }, data);
```

:::

</TypeScriptEditor>

#### 解析值/返回值 {#resolutionreturn}

与 [useSuspense](/docs/api/useSuspense)、[useDLE](/docs/api/useDLE)、[useCache](/docs/api/useCache) 等数据绑定 :react[hook]:vue[composable] 一起使用时，
或与 [Controller.fetch](/docs/api/Controller#fetch) 一起使用时，返回值由 [schema](#schema) 决定

<TypeScriptEditor>

```ts title="Todo.ts" collapsed
export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;

  static key = 'Todo';
}
```

:::react

```ts title="getTodo.ts"
import { Todo } from './Todo';

const getTodo = new RestEndpoint({ path: '/', schema: Todo });
// Hover your mouse over 'todo' to see its type
const todo = useSuspense(getTodo);

async () => {
  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

:::

:::vue

```ts title="getTodo.ts"
import { Todo } from './Todo';

const getTodo = new RestEndpoint({ path: '/', schema: Todo });
// Hover your mouse over 'todo' to see its type
const todo = await useSuspense(getTodo);

async () => {
  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

:::

</TypeScriptEditor>

直接调用 endpoint 时，解析值由 [process](#process) 决定。对于
没有 schema 的 `RestEndpoints`，它还决定 :react[[hook](/docs/api/useSuspense)]:vue[[composable](/docs/api/useSuspense)] 以及 [Controller.fetch](/docs/api/Controller#fetch) 的返回类型。

<TypeScriptEditor>

```ts path="process.ts"
interface TodoInterface {
  title: string;
  completed: boolean;
}
const getTodo = new RestEndpoint({
  path: '/',
  process(value): TodoInterface {
    return value;
  },
});
async () => {
  // todo is TodoInterface
  const todo = await getTodo();

  const ctrl = useController();
  const todo2 = await ctrl.fetch(getTodo);
};
```

</TypeScriptEditor>

#### 函数参数 {#function-parameters}

用于构造 url 的 [path](#path) 决定了第一个参数的类型。如果其中没有任何模式，
则会跳过“第一个”参数。

<TypeScriptEditor>

```ts
const getRoot = new RestEndpoint({ path: '/' });
getRoot();
const getById = new RestEndpoint({ path: '/:id' });
// both number and string types work as they are serialized into strings to construct the url
getById({ id: 5 });
getById({ id: '5' });
```

</TypeScriptEditor>

[method](#method) 决定是否存在作为 [body](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#body) 发送的第二个参数。

<TypeScriptEditor>

```ts path=method.ts
export const update = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
});
update({ id: 5 }, { title: 'updated', completed: true });
```

</TypeScriptEditor>

不过，它的类型是 'any'，因此无法捕获拼写错误。

[body](#body) 可用于为 url 参数之后的那个参数指定类型。它只用于类型，因此
传入的值是什么并不重要。可以用 `undefined` 值来“禁用”第二个参数。

<TypeScriptEditor>

```ts path=body.ts
export const update = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
  body: {} as TodoInterface,
});
update({ id: 5 }, { title: 'updated', completed: true });
// `undefined` disables 'body' argument
const rpc = new RestEndpoint({
  path: '/:id',
  method: 'PUT',
  body: undefined,
});
rpc({ id: 5 });
```

</TypeScriptEditor>

[searchParams](#searchParams) 的用法与 `body` 类似，用于为额外参数指定类型，这些参数会
作为 [url()](#url) 中的 GET searchParams/queryParams。

```ts
const getUsers = new RestEndpoint({
  path: '/:group/user/:id',
  searchParams: {} as { isAdmin?: boolean; sort: 'asc' | 'desc' },
});
getUsers.url({ group: 'big', id: '5', sort: 'asc' }) ===
  '/big/user/5?sort=asc';
getUsers.url({
  group: 'big',
  id: '5',
  sort: 'desc',
  isAdmin: true,
}) === '/big/user/5?isAdmin=true&sort=desc';
```

## 获取生命周期 {#fetch-lifecycle}

RestEndpoint 在 Endpoint 的基础上，允许通过[继承](#inheritance)或 [.extend()](#extend)
对内置的 fetch 方法进行定制。

import Lifecycle from '../diagrams/\_restendpoint_lifecycle.mdx';

<Lifecycle/>

```ts title="fetch implementation for RestEndpoint"
function fetch(...args) {
  const urlParams = this.#hasBody && args.length < 2 ? {} : args[0] || {};
  const body = this.#hasBody ? args[args.length - 1] : undefined;
  return this.fetchResponse(
    this.url(urlParams),
    await this.getRequestInit(body),
  )
    .then(response => this.parseResponse(response))
    .then(res => this.process(res, ...args));
}
```

## 准备获取 {#prepare-fetch}

成员同时也是选项（构造函数的第二个参数）。虽然它们都不是必需的，但前几个
有默认值。

### url(params): string {#url}

`urlPrefix` + `path template` + '?' + searchToString(`searchParams`)

`url()` 使用 `params` 填充 [path 模板](#path)。之后，所有未用到的 `params` 成员都会被用作
[searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams)（也就是“GET”参数——即 `?` 后面的部分）。

<details collapsed>
<summary><b>实现</b></summary>

```typescript
import { getUrlBase, getUrlTokens } from '@data-client/rest';

url(urlParams = {}) {
  const urlBase = getUrlBase(this.path)(urlParams);
  const tokens = getUrlTokens(this.path);
  const searchParams = {};
  Object.keys(urlParams).forEach(k => {
    if (!tokens.has(k)) {
      searchParams[k] = urlParams[k];
    }
  });
  if (Object.keys(searchParams).length) {
    return `${this.urlPrefix}${urlBase}?${this.searchToString(searchParams)}`;
  }
  return `${this.urlPrefix}${urlBase}`;
}
```

</details>

### searchToString(searchParams): string {#searchToString}

构造 [url](#url) 中的 [searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams) 部分。

默认使用标准的全局 [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)。

[searchParams](https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams)（也称 queryParams）会被排序，以保证结果的确定性。

<details collapsed>
<summary><b>实现</b></summary>

```typescript
searchToString(searchParams) {
  const params = new URLSearchParams(searchParams);
  params.sort();
  return params.toString();
}
```

</details>

#### 使用 `qs` 库 {#using-qs-library}

要在 searchParams 中编码复杂对象，可以使用 [qs](https://github.com/ljharb/qs) 库。

```typescript
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

class QSEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  searchToString(searchParams) {
    // highlight-next-line
    return qs.stringify(searchParams);
  }
}
```

<EndpointPlayground input="/foo?a%5Bb%5D=c" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}}>

```typescript title="QSEndpoint" collapsed {7}
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

export default class QSEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  searchToString(searchParams) {
    return qs.stringify(searchParams);
  }
}
```

```typescript title="getFoo"
import QSEndpoint from './QSEndpoint';

const getFoo = new QSEndpoint({
  path: '/foo',
  searchParams: {} as { a: Record<string, string> },
});

getFoo({ a: { b: 'c' } });
```

</EndpointPlayground>

### path: string {#path}

使用 [path-to-regexp v8](https://github.com/pillarjs/path-to-regexp)，根据传入的参数
构建 url。它同时也决定了类型，从而确保类型被正确约束。

#### 参数 {#parameters}

以 `:` 为前缀的单词是参数名。字符串和数字都可以作为参数值，
因为它们会被序列化到 url 字符串中。

<TypeScriptEditor>

```ts
const getThing = new RestEndpoint({ path: '/:group/things/:id' });
getThing({ group: 'first', id: 77 });
```

</TypeScriptEditor>

#### 可选参数 {#optional-parameters}

用 `{}` 包裹可选片段（包括其前缀），即可使其成为[可选](https://github.com/pillarjs/path-to-regexp?tab=readme-ov-file#optional)的。
可选参数的类型会变为 `string | number | undefined`。

<TypeScriptEditor>

```ts
const optional = new RestEndpoint({
  path: '/:group/things{/:number}',
});
optional({ group: 'first' });
optional({ group: 'first', number: 'fifty' });
```

</TypeScriptEditor>

多个可选片段可以用不同的前缀串联起来：

```ts
const ep = new RestEndpoint({
  path: '{/:attr1}{-:attr2}{-:attr3}',
});

ep({ attr1: 'hi' });
ep({ attr2: 'hi' });
ep({ attr1: 'hi', attr3: 'ho' });
```

#### 通配符（重复参数） {#wildcards-repeating-parameters}

`*name` 匹配一个或多个路径片段。用 `{}` 包裹可使其匹配零个或多个（可选）。
通配符参数的类型为 `string[]`（数组），因为它们表示多个路径片段。

```ts
const files = new RestEndpoint({ path: '/files/*path' });
files({ path: ['documents', 'reports', 'q4'] });
// URL: /files/documents/reports/q4

const optionalFiles = new RestEndpoint({ path: '/files{/*path}' });
optionalFiles({});
// URL: /files
optionalFiles({ path: ['documents'] });
// URL: /files/documents
```

#### 加引号的参数名 {#quoted-parameter-names}

参数名必须是合法的 JavaScript 标识符。包含 `-` 或 `.` 等特殊字符的名称
必须用双引号括起来：

```ts
const ep = new RestEndpoint({ path: '/:"with-dash"/:"my.param"' });
ep({ 'with-dash': 'hello', 'my.param': 'world' });
```

#### 转义特殊字符 {#escaping-special-characters}

字符 `{}()*:` 和 `\\` 在 path-to-regexp 中具有特殊含义，作为字面量使用时必须用 `\\` 转义。

<TypeScriptEditor>

```ts
const getSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
});
getSite({ slug: 'first' });
```

</TypeScriptEditor>

`?` 和 `+` 在 path-to-regexp v8 中**不是**特殊字符，无需转义。
这意味着可以在 path 中直接嵌入查询字符串，而无需转义 `?`：

```ts
const search = new RestEndpoint({
  path: '/search?{q=:q}{&page=:page}',
});
search({ q: 'test', page: 1 });
// URL: /search?q=test&page=1
```

:::info

类型会根据 `path` 自动推断。

额外的参数可以通过 [searchParams](#searchParams)
和 [body](#body) 来指定。

:::

### searchParams {#searchParams}

`searchParams` 可用于为额外参数指定类型，这些参数会作为 [url()](#url) 中的 GET searchParams/queryParams。

其实际的**值不会以任何方式被使用**——它只决定[类型](#typing)。

<EndpointPlayground input="https://site.com/cool?isReact=true" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}}>

```typescript title="getFoo"
import { RestEndpoint } from '@data-client/rest';

const getReactSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
  searchParams: {} as { isReact: boolean },
});

getReactSite({ slug: 'cool', isReact: true });
```

</EndpointPlayground>

### body {#body}

`body` 可用于为变更类 endpoint 设置第二个参数。其实际的**值不会以任何方式
被使用**——它只决定[类型](#typing)。

它只用于 method 会携带 body 的 endpoint：'POST'、'PUT'、'PATCH'。

<EndpointPlayground input="https://site.com/cool" init={{method: 'POST', body: '{ "url": "/" }', headers: {'Content-Type': 'application/json'}}}>

```ts {6}
import { RestEndpoint } from '@data-client/rest';

const updateSite = new RestEndpoint({
  path: 'https\\://site.com/:slug',
  method: 'POST',
  body: {} as { url: string },
});

updateSite({ slug: 'cool' }, { url: '/' });
```

</EndpointPlayground>

### paginationField {#paginationfield}

如果指定，会在 `RestEndpoint` 上添加 [getPage](#getpage) 方法。参见[分页指南](../guides/pagination.md)。Schema
中还必须包含一个 [Collection](./Collection.md)。

### urlPrefix: string = '' {#urlPrefix}

将其添加到编译后的 [path](#path) 之前

#### 通过继承设置默认值 {#inheritance-defaults}

```typescript
export class MyEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // this allows us to override the prefix in production environments, with a dev fallback
  urlPrefix = process.env.API_SERVER ?? 'http://localhost:8000';
}
```

[进一步了解 RestEndpoint 的继承模式](#inheritance)

#### 实例覆盖 {#instance-overrides}

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:product_id/ticker',
  schema: Ticker,
});
```

#### 动态前缀 {#dynamic-prefix}

:::tip

如需动态前缀，可以改为覆盖 url() 方法：

```ts
const getTodo = new RestEndpoint({
  path: '/todo/:id',
  url(...args) {
    return dynamicPrefix() + super.url(...args);
  },
});
```

:::

### method: string = 'GET' {#method}

[Method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) 是 HTTP 协议的一部分。
REST 协议用它来表示操作的类型。因此，RestEndpoint 会据此
确定 `sideEffect`，以及该 endpoint 是否应使用 `body` 负载。显式设置
`sideEffect` 会覆盖这一行为，从而支持非标准的 API 设计。

`GET` 是“只读”的，其他 method 则意味着存在副作用。

`GET` 和 `DELETE` 默认都没有 `body`。

:::tip[method 如何影响函数参数]

`method` 只会影响 RestEndpoint 构造函数中的参数，而*不会*影响 [.extend()](#extend)。
这使得非标准的 method 与 body 组合成为可能。

`body` 默认为 `any`。你始终可以显式设置 body 以获得完全控制。可以用 `undefined`
表示没有 body。

<TypeScriptEditor>

```ts
(id: string, myPayload: Record<string, unknown>) => {
  const standardCreate = new RestEndpoint({
    path: '/:id',
    method: 'POST',
  });
  standardCreate({ id }, myPayload);
  const nonStandardEndpoint = new RestEndpoint({
    path: '/:id',
    method: 'POST',
    body: undefined,
  });
  // no second 'body' argument, because body was set to 'undefined'
  nonStandardEndpoint({ id });
};
```

</TypeScriptEditor>

:::

### getRequestInit(body): RequestInit {#getRequestInit}

准备 fetch 中使用的 [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)。
它会被传给 [fetchResponse](#fetchResponse)

普通对象或数组形式的 `body` 会被编码为 JSON，并附带 `Content-Type: application/json` header，除非
`requestInit` 或 [getHeaders](#getHeaders) 已经设置了该 header。其他任何 `body`，例如 `FormData`、`Blob`、
`URLSearchParams` 或字符串，都会原样传给 `fetch()`。

:::tip async

<TypeScriptEditor>

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getRequestInit(body) {
    return {
      ...(await super.getRequestInit(body)),
      method: await getMethod(),
    };
  }
}

async function getMethod() {
  return 'GET';
}
```

</TypeScriptEditor>

:::

### getHeaders(headers: HeadersInit): HeadersInit {#getHeaders}

由 [getRequestInit](#getRequestInit) 调用，用于确定 [HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/API/Request/headers)

这通常在[认证](../guides/auth)时很有用

:::warning

不要在这里使用 :react[hook]:vue[composable]。如果需要使用 :react[hook]:vue[composable]，可以试试 [hookifyResource](./hookifyResource.md)

:::

:::tip async

<TypeScriptEditor>

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'Access-Token': await getAuthToken(),
    };
  }
}

async function getAuthToken() {
  return 'example';
}
```

</TypeScriptEditor>

:::

## 处理获取 {#handle-fetch}

### fetchResponse(input, init): Promise {#fetchResponse}

执行 [fetch(input, init)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 调用。当
[response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok) 不为 `true` 时（例如 404），
会抛出 NetworkError。

### content {#content}

控制如何解析 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 的 body。
设置后，返回类型会被自动推断；对于非 JSON 的内容类型，`schema` 会被限制为 `undefined`。

| 值 | 解析方式 | 返回类型 |
|---|---|---|
| `'json'` | [response.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) | `any` |
| `'blob'` | [response.blob()](https://developer.mozilla.org/en-US/docs/Web/API/Response/blob) | `Blob` |
| `'text'` | [response.text()](https://developer.mozilla.org/en-US/docs/Web/API/Response/text) | `string` |
| `'arrayBuffer'` | [response.arrayBuffer()](https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer) | `ArrayBuffer` |
| `'stream'` | `response.body` | `ReadableStream<Uint8Array>` |
| *未设置* | 根据 Content-Type header 自动检测 | `any` |

未设置 `content` 时，`parseResponse` 会根据
`Content-Type` header 自动检测响应类型：JSON 类型调用 `.json()`，二进制类型（图片、`application/octet-stream`、
PDF 等）调用 `.blob()`，文本类类型则调用 `.text()`。

#### 文件下载 {#file-download}

下载文件时，请设置 `content: 'blob'`。返回类型为 `Blob`，且 `schema` 必须为
`undefined`（二进制数据无法被规范化）。使用 `dataExpiryLength: 0` 可以避免在内存中缓存
大型 blob。

```ts
const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
});
```

要从 `Content-Disposition` header 中提取文件名，请覆盖 `parseResponse`：

```ts
const downloadFile = new RestEndpoint({
  path: '/files/:id/download',
  content: 'blob',
  dataExpiryLength: 0,
  async parseResponse(response) {
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    const filename =
      disposition?.match(/filename="?(.+?)"?$/)?.[1] ?? 'download';
    return { blob, filename };
  },
  process(value): { blob: Blob; filename: string } {
    return value;
  },
});
```

关于结合浏览器下载触发的完整用法，请参阅[文件下载指南](../guides/network-transform.md#file-download)。

### parseResponse(response): Promise {#parseResponse}

接收 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 并解析其 body。

设置了 [`content`](#content) 时，由它直接控制解析方式。否则，会根据
[`Content-Type` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) 自动检测：
JSON 类型调用 [.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json)，二进制
类型调用 [.blob()](https://developer.mozilla.org/en-US/docs/Web/API/Response/blob)，文本类
类型调用 [.text()](https://developer.mozilla.org/en-US/docs/Web/API/Response/text)。

如果 `status` 为 204，则 resolve 为 `null`。

对于需要同时提取 header 和 body 等高级场景，可以覆盖此方法。

### process(value, ...args): any {#process}

对解析后的结果执行任意变换。默认为恒等函数（什么也不做）。

`args` 是调用 endpoint 时传入的参数。它们的类型来自 endpoint 的 [path](#path)、
[searchParams](#searchParams) 和 [body](#body)，包括在同一次 [extend()](#extend) 调用中设置的那些。

```ts
const getUser = new RestEndpoint({ path: '/users/:id' });

const getUserWithId = getUser.extend({
  process(value, params) {
    // params is { id: string | number }
    return { ...value, id: `${params.id}` };
  },
});
```

:::tip

process 的返回类型可用于设置 endpoint 获取的返回类型：

<TypeScriptEditor row={false}>

```ts title="getTodo.ts" {4}
export const getTodo = new RestEndpoint({
  path: '/todos/:id',
  // The identity function is the default value; so we aren't changing any runtime behavior
  process(value): TodoInterface {
    return value;
  },
});

interface TodoInterface {
  id: string;
  title: string;
  completed: boolean;
}
```

```ts title="useTodo.ts"
import { getTodo } from './getTodo';

async (id: string) => {
  // hover title to see it is a string
  // see TS autocomplete by deleting `.title` and retyping the `.`
  const title = (await getTodo({ id })).title;
};
```

</TypeScriptEditor>

:::

## Endpoint 生命周期 {#endpoint-lifecycle}

### schema?: Schema {#schema}

[声明式数据生命周期](./schema.md)

- 借助 [DRY](https://www.plutora.com/blog/understanding-the-dry-dont-repeat-yourself-principle) 状态实现全局数据一致性和高性能：说明[在哪里](./schema.md)会出现 [Entities](./Entity.md)
- 用于[反序列化字段](/rest/guides/network-transform#deserializing-fields)的函数
- [竞态条件处理](./Entity.md#shouldreorder)
- [校验](./Entity.md#validate)

```tsx
import { Entity, RestEndpoint } from '@data-client/rest';

class User extends Entity {
  id = '';
  username = '';
}

const getUser = new RestEndpoint({
  path: '/users/:id',
  schema: User,
});
```

### key(urlParams): string {#key}

序列化参数。它用于在全局 store 中构建查找键。

默认实现：

```typescript
`${this.method} ${this.url(urlParams)}`;
```

### testKey(key): boolean {#testKey}

如果提供的（获取）[key](#key) 与此 endpoint 匹配，则返回 `true`。

它用于 [&lt;MockResolver /&gt;](/docs/api/MockResolver) 的模拟 interceptor，
以及 [Controller.expireAll()](/docs/api/Controller#expireAll) 和 [Controller.invalidateAll()](/docs/api/Controller#invalidateAll)。

import EndpointLifecycle from './_EndpointLifecycle.mdx';

<EndpointLifecycle />

## extend(options): RestEndpoint {#extend}

可用于进一步定制 endpoint 的定义

```typescript
const getUser = new RestEndpoint({ path: '/users/:id' });

const UserDetailNormalized = getUser.extend({
  schema: User,
  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  },
});
```

## 专用扩展器 {#specialized-extenders}

这些便捷访问器会为常见的 [Collection](./Collection.md) 操作创建新的 endpoint。
只有当 `RestEndpoint` 的 schema 中包含 [Collection](./Collection.md) 时，它们才能使用。

### push {#push}

创建一个 POST endpoint，将新创建的 Entity 放到 [Collection](./Collection.md) 的*末尾*。

返回一个新的 RestEndpoint，其 [method](#method) 为 'POST'，schema 为 [Collection.push](./Collection.md#push)

```tsx
import { RestEndpoint, Collection } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Todo } from './resources';

const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo]),
});
const ctrl = useController();

// POST /todos - adds new Todo to the end of the list
const newTodo = await ctrl.fetch(
  getTodos.push,
  { userId: '1' },
  { title: 'Buy groceries' },
);
```

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// POST /groups/five/users - adds new User to the end of the list
const newUser = await ctrl.fetch(
  UserResource.getList.push,
  { group: 'five' },
  { username: 'newuser', email: 'new@example.com' },
);

// Send an array to create several at once; they're added to the end in order
await ctrl.fetch(
  UserResource.getList.push,
  { group: 'five' },
  [{ username: 'ana' }, { username: 'bo' }],
);
```

### unshift {#unshift}

创建一个 POST endpoint，将新创建的 Entity 放到 [Collection](./Collection.md) 的*开头*。

返回一个新的 RestEndpoint，其 [method](#method) 为 'POST'，schema 为 [Collection.unshift](./Collection.md#unshift)

```tsx
import { RestEndpoint, Collection } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Todo } from './resources';

const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo]),
});
const ctrl = useController();

// POST /todos - adds new Todo to the beginning of the list
const newTodo = await ctrl.fetch(
  getTodos.unshift,
  { userId: '1' },
  { title: 'Urgent task' },
);
```

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// POST /groups/five/users - adds new User to the start of the list
const newUser = await ctrl.fetch(
  UserResource.getList.unshift,
  { group: 'five' },
  { username: 'priorityuser', email: 'priority@example.com' },
);
```

### assign {#assign}

创建一个 POST endpoint，将 Entity 合并到 [Values](./Values.md) [Collection](./Collection.md) 中。

返回一个新的 RestEndpoint，其 [method](#method) 为 'POST'，schema 为 [Collection.assign](./Collection.md#assign)

```tsx
import { RestEndpoint, Collection, Values } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Stats } from './resources';

const getStats = new RestEndpoint({
  path: '/products/stats',
  schema: new Collection(new Values(Stats)),
});
const ctrl = useController();

// POST /products/stats - add/update entries in the Values collection
await ctrl.fetch(getStats.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
  'ETH-USD': { product_id: 'ETH-USD', volume: 500 },
});
```

```tsx
import { resource, Collection, Values } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Stats } from './resources';

const StatsResource = resource({
  urlPrefix: 'https://api.exchange.example.com',
  path: '/products/:product_id/stats',
  schema: Stats,
}).extend({
  getList: {
    path: '/products/stats',
    schema: new Collection(new Values(Stats)),
  },
});
const ctrl = useController();

// POST /products/stats - add/update entries
await ctrl.fetch(StatsResource.getList.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
});
```

### remove {#remove}

创建一个 PATCH endpoint，从 [Collection](./Collection.md) 中移除 Entity，并用响应更新它们。

返回一个新的 RestEndpoint，其 [method](#method) 为 'PATCH'，schema 为 [Collection.remove](./Collection.md#remove)

```tsx
import { RestEndpoint, Collection } from '@data-client/rest';
import { useController } from '@data-client/react';
import { Todo } from './resources';

const getTodos = new RestEndpoint({
  path: '/todos',
  schema: new Collection([Todo]),
});
const ctrl = useController();

// PATCH /todos - removes Todo from collection AND updates the entity
await ctrl.fetch(getTodos.remove, { id: '123', completed: true });
```

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// PATCH /groups/five/users - removes user from 'five' group list
// AND updates the user entity with response data (e.g., new group)
await ctrl.fetch(
  UserResource.getList.remove,
  { group: 'five' },
  { id: '2', group: 'newgroup' },
);
```

要在其他 endpoint（例如 DELETE）上使用 remove schema：

```ts
const deleteAndRemove = MyResource.delete.extend({
  schema: MyResource.getList.schema.remove,
});
```

### move {#move}

创建一个 PATCH endpoint，在 [Collections](./Collection.md) 之间移动 Entity。它会从
与该 Entity 现有状态匹配的 collection 中移除它，并添加到与新值（来自 body/最后一个参数）
匹配的 collection 中。

返回一个新的 RestEndpoint，其 [method](#method) 为 'PATCH'，schema 为 [Collection.move](./Collection.md#move)

import { kanbanFixtures, getInitialInterceptorData } from '@site/src/fixtures/kanban';

<FrameworkPlayground defaultOpen="n" row fixtures={kanbanFixtures} getInitialInterceptorData={getInitialInterceptorData}>

```ts title="TaskResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Task extends Entity {
  id = '';
  title = '';
  status = 'backlog';
  pk() { return this.id; }
  static key = 'Task';
}
export const TaskResource = resource({
  path: '/tasks/:id',
  searchParams: {} as { status: string },
  schema: Task,
  optimistic: true,
});
```

:::react

```tsx title="TaskCard" {5-9}
import { useController } from '@data-client/react';
import { TaskResource, type Task } from './TaskResource';

export default function TaskCard({ task }: { task: Task }) {
  const handleMove = () => ctrl.fetch(
    TaskResource.getList.move,
    { id: task.id },
    { id: task.id, status: task.status === 'backlog' ? 'in-progress' : 'backlog' },
  );
  const ctrl = useController();
  return (
    <div className="listItem">
      <span style={{ flex: 1 }}>{task.title}</span>
      <button onClick={handleMove}>
        {task.status === 'backlog' ? '\u25bc' : '\u25b2'}
      </button>
    </div>
  );
}
```

```tsx title="TaskBoard" collapsed
import { useSuspense } from '@data-client/react';
import { TaskResource } from './TaskResource';
import TaskCard from './TaskCard';

function TaskBoard() {
  const backlog = useSuspense(TaskResource.getList, { status: 'backlog' });
  const inProgress = useSuspense(TaskResource.getList, { status: 'in-progress' });
  return (
    <div>
      <div className="boardColumn">
        <h4>Backlog</h4>
        {backlog.map(task => <TaskCard key={task.pk()} task={task} />)}
      </div>
      <div className="boardColumn">
        <h4>Active</h4>
        {inProgress.map(task => <TaskCard key={task.pk()} task={task} />)}
      </div>
    </div>
  );
}
render(<TaskBoard />);
```

:::

:::vue

```html title="TaskCard.vue" {7-16}
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TaskResource, type Task } from './TaskResource';

  const props = defineProps<{ task: Task }>();
  const ctrl = useController();
  const handleMove = () =>
    ctrl.fetch(
      TaskResource.getList.move,
      { id: props.task.id },
      {
        id: props.task.id,
        status:
          props.task.status === 'backlog' ? 'in-progress' : 'backlog',
      },
    );
</script>

<template>
  <div class="listItem">
    <span style="flex: 1">{{ task.title }}</span>
    <button @click="handleMove">
      {{ task.status === 'backlog' ? '\u25bc' : '\u25b2' }}
    </button>
  </div>
</template>
```

```html title="TaskBoard.vue" collapsed
<script setup lang="ts">
  import { useFetch, useSuspense } from '@data-client/vue';
  import { TaskResource } from './TaskResource';
  import TaskCard from './TaskCard.vue';

  // start both fetches in parallel before awaiting
  useFetch(TaskResource.getList, { status: 'backlog' });
  useFetch(TaskResource.getList, { status: 'in-progress' });
  const backlog = await useSuspense(TaskResource.getList, {
    status: 'backlog',
  });
  const inProgress = await useSuspense(TaskResource.getList, {
    status: 'in-progress',
  });
</script>

<template>
  <div>
    <div class="boardColumn">
      <h4>Backlog</h4>
      <TaskCard v-for="task in backlog" :key="task.pk()" :task="task" />
    </div>
    <div class="boardColumn">
      <h4>Active</h4>
      <TaskCard v-for="task in inProgress" :key="task.pk()" :task="task" />
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

移除时的过滤基于该 Entity 在 store 中的**现有**值。
添加时的过滤基于合并后的 Entity 值（现有值 + body）。
它与 push/remove 使用相同的 [createCollectionFilter](./Collection.md#createcollectionfilter) 逻辑。

```tsx
import { resource } from '@data-client/rest';
import { useController } from '@data-client/react';
import { User } from './resources';

const UserResource = resource({
  path: '/groups/:group/users/:id',
  schema: User,
});
const ctrl = useController();

// PATCH /groups/five/users/5 - moves user 5 from 'five' group to 'ten' group
await ctrl.fetch(
  UserResource.getList.move,
  { group: 'five', id: '2' },
  { id: '2', group: 'ten' },
);
```

### getPage {#getpage}

一个以 [paginationField](#paginationfield) 作为 searchParameter 键来获取下一页的 endpoint。Schema
中还必须包含一个 [Collection](./Collection.md)

:::react

```tsx nocheck
const getTodos = new RestEndpoint({
  path: '/todos',
  schema: Todo,
  paginationField: 'page',
});

const todos = useSuspense(getTodos);
const ctrl = useController();
return (
  <PaginatedList
    items={todos}
    fetchNextPage={() =>
      // fetches url `/todos?page=${nextPage}`
      ctrl.fetch(getTodos.getPage, { page: nextPage })
    }
  />
);
```

:::

:::vue

```html
<script lang="ts">
  import { RestEndpoint } from '@data-client/rest';
  import { Todo } from './resources';

  const getTodos = new RestEndpoint({
    path: '/todos',
    schema: Todo,
    paginationField: 'page',
  });
</script>

<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import PaginatedList from './PaginatedList.vue';

  const todos = await useSuspense(getTodos);
  const ctrl = useController();
  // fetches url `/todos?page=${nextPage}`
  const fetchNextPage = (nextPage: number) =>
    ctrl.fetch(getTodos.getPage, { page: nextPage });
</script>

<template>
  <PaginatedList :items="todos" :fetchNextPage="fetchNextPage" />
</template>
```

:::

更多信息请参阅[分页指南](../guides/pagination.md)。

### paginated(paginationfield) {#paginated}

创建一个新的 endpoint，它带有一个额外的 `paginationfield` 字符串，用于查找特定的
页面，并将结果追加到此 endpoint。更多信息请参阅[无限滚动分页](../guides/pagination.md#infinite-scrolling)。

```ts
const getNextPage = getList.paginated('cursor');
```

Schema 中还必须包含一个 [Collection](./Collection.md)

### paginated(removeCursor) {#paginated-function}

```typescript
function paginated<E, A extends any[]>(
  this: E,
  removeCursor: (...args: A) => readonly [...Parameters<E>],
): PaginationEndpoint<E, A>;
```

函数形式允许对参数进行任意处理。这与上面传入 `cursor` 字符串是等价的。

```ts
const getNextPage = getList.paginated(
  ({ cursor, ...rest }: { cursor: string | number }) =>
    (Object.keys(rest).length ? [rest] : []) as any,
);
```

`removeCusor` 是一个函数，它接收获取 `getNextPage` 时传入的参数，并返回
用于更新 `getList` 的参数。

Schema 中还必须包含一个 [Collection](./Collection.md)

## 继承 {#inheritance}

请务必使用 `RestGenerics`，以保证类型正常工作。

```ts
import { RestEndpoint, type RestGenerics } from '@data-client/rest';

class GithubEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.github.com';

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'Access-Token': getAuth(),
    };
  }
}
```
