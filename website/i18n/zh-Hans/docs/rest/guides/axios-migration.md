---
title: 从 Axios 迁移到 Reactive Data Client
sidebar_label: Axios 迁移
---

import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import PkgTabs from '@site/src/components/PkgTabs';
import DiffEditor from '@site/src/components/DiffEditor';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';

# 从 Axios 迁移

[`@data-client/rest`](/rest) 用带类型的 endpoint 定义取代 axios 调用。组件仍然直接调用它们，
因此应用加载和存储数据的方式不会改变；改变的只是调用的形式。[codemod](#codemod) 会转换这些调用；下面的
[步骤](#steps)涵盖其余部分。

<SiteOnly>

## 使用你的编程智能体迁移 {#agent}

把下面的内容粘贴到你的智能体聊天中：

```prompt
Replace this app's axios calls with `@data-client/rest` endpoints, without changing how components load or store data. Install the REST setup skill first: `npx skills add reactive/data-client --skill data-client-rest-setup -y`, then read `.agents/skills/data-client-rest-setup/SKILL.md` and follow it.
```

REST setup [skill](/docs/getting-started/agent-skills) 遵循本指南：它会运行 codemod，然后逐一完成
codemod 无法完成的[步骤](#steps)。像审查队友的代码一样审查它的 diff。

</SiteOnly>

<AgentOnly>

要把应用从 axios 迁移过来，请在项目根目录安装 REST setup skill：

```bash
npx skills add reactive/data-client --skill data-client-rest-setup -y
```

然后阅读 `.agents/skills/data-client-rest-setup/SKILL.md` 并按照它操作；它会检测 axios 并遵循下面的
[步骤](#steps)。只替换 axios 调用及其定义：保持组件、数据加载和状态
管理不变，除非用户要求修改它们。

</AgentOnly>

## 为什么要迁移？ {#why-migrate}

<DiffEditor caption="URL 只需声明一次：路径参数会根据 `path` 模板获得类型并被编码，其余参数则成为查询字符串。调用方式不变。">

```ts title="Before"
const getComments = ({
  userId,
  postId,
  sort,
}: {
  userId: string;
  postId: string;
  sort?: 'newest' | 'top';
}) =>
  // callout: Each parameter is typed, encoded and placed by hand, and nothing checks the template against the type.
  axios.get(
    `/users/${encodeURIComponent(userId)}/posts/${encodeURIComponent(postId)}/comments`,
    { params: { sort } },
  );

getComments({ userId: user.id, postId: post.id, sort: 'newest' });
```

```ts title="After"
const getComments = new RestEndpoint({
  // callout: `userId` and `postId` are typed and encoded from the template, so a missing or misspelled one is a compile error.
  path: '/users/:userId/posts/:postId/comments',
  searchParams: {} as { sort?: 'newest' | 'top' },
});

getComments({ userId: user.id, postId: post.id, sort: 'newest' });
```

</DiffEditor>

- **端到端类型安全**：路径参数、body 和响应的类型都来自各自的定义。
- **更少的代码**：[`resource()`](../api/resource.md) 只需 `path` 和 `schema` 就能生成完整的 CRUD API。
- **请求行为集中在一处**：基础 endpoint 的方法取代了 interceptor 和每次调用的配置。
- **为 store 做好准备**：同样的 endpoint 和 schema 可以配合 [`useSuspense()`](/docs/api/useSuspense) 和
  规范化缓存使用，随时可以采用。

## 逐步迁移 {#steps}

<SiteOnly>

这些就是你的智能体遵循的步骤。在每一步之前先提交，这样你就可以审查它的 diff。

</SiteOnly>

### 1. 安装 {#install}

<PkgTabs pkgs="@data-client/rest" />

### 2. 运行 codemod {#codemod}

一个 [jscodeshift](https://github.com/facebook/jscodeshift) codemod 负责机械性的部分。先提交，然后在
你的源码目录上运行它，不要在仓库根目录运行：

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

<DiffEditor caption="每个 axios 调用都会变成对 endpoint 的调用。路径参数、`params` 和 body 成为它的参数，它会解析为 body，因此 `.data` 不再需要。">

```ts title="Before"
import axios from 'axios';

const api = axios.create({ baseURL: 'https://api.example.com' });

export async function getPost(id: string) {
  const res = await api.get(`/posts/${id}`);
  return res.data;
}

export async function createPost(body: { title: string }) {
  const { data } = await api.post('/posts', body);
  return data;
}
```

```ts title="After"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';
}

export async function getPost(id: string) {
  const res = await new ApiEndpoint({ path: '/posts/:id' })({ id });
  return res;
}

export async function createPost(body: { title: string }) {
  const data = await new ApiEndpoint({ path: '/posts', method: 'POST' })(
    body,
  );
  return data;
}
```

</DiffEditor>

它无法转换的内容，例如 interceptor、`timeout`、`isAxiosError()`，或把 axios
响应返回给调用方的函数，会得到一条 `// TODO(data-client):` 注释，链接到下文中对应的章节。搜索
`TODO(data-client)`，并在完成后续步骤时逐一解决。

如果项目把 axios 封装在自己的类或函数中，从不直接调用 `axios.get()` 或 `.post()`，或者只
调用 `axios(config)`，codemod 就没什么可做的。跳过它，从[第 3 步](#base-endpoint)开始。

### 3. 把 interceptor 移到基础 endpoint 中 {#base-endpoint}

Axios 的 interceptor 和实例配置会变成一个 `RestEndpoint` 子类上的方法，所有 endpoint 都继承这个子类。
codemod 会根据 `axios.create()` 创建这个类；把 interceptor 移到其中。

<DiffEditor caption="`RestEndpoint` 会自行解析 JSON，因此只用于解包 `response.data` 的 interceptor 已无事可做。">

```ts title="Before"
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'my-key' },
});

api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

api.interceptors.response.use(response => response.data);

export default api;
```

```ts title="After"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  // callout: Runs before every request, like a request interceptor. It can be `async`, to refresh a token first.
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'X-API-Key': 'my-key',
      Authorization: `Bearer ${getToken()}`,
    };
  }
}
```

</DiffEditor>

修改响应体的响应 interceptor（例如转换 `snake_case` 键名）应放在
[`process()`](../api/RestEndpoint.md#process) 中；参见 [snake 转 camel](./network-transform.md#snakes-to-camels)。

当响应 interceptor 返回 `response.data` 时，调用方的 `.data` 读取的是 body 中的字段，而不是 axios 的响应，
因此要保留它。当 interceptor 位于同一文件中时，codemod 会标记这些调用；如果全局的
`axios.interceptors.response` 位于另一个文件中，请检查它从那里的调用中移除的 `.data`。

#### 服务器错误消息 {#server-error-messages}

Axios 代码库经常把 `error.response.data.error` 或 `.message` 展示给用户。在基类的
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 中从 `Response` 的 body 读取一次，这样调用处就可以从
`error.message` 获取它：

```ts title="ApiEndpoint.ts"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    try {
      return await super.fetchResponse(input, init);
    } catch (error) {
      if (error instanceof NetworkError) {
        const body = await error.response
          .clone()
          .json()
          .catch(() => null);
        // keep the NetworkError so `status` and `errorPolicy()` still work
        error.message = body?.error ?? body?.message ?? error.message;
      }
      throw error;
    }
  }
}
```

#### 已有的 endpoint 抽象 {#existing-endpoint-abstractions}

封装了 axios 的自定义 endpoint 类（比如带有 `path`、`method` 和 `toDynamicUrl()` 辅助方法）可以继承
`RestEndpoint`，而不必被替换。它会保留向后兼容的方法，并获得
[`url()`](../api/RestEndpoint.md#url)、[`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)、
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 和 [`parseResponse()`](../api/RestEndpoint.md#parseResponse)：

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export class LegacyEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = API_ROOT;
  declare queryKey?: string;

  /** @deprecated use url() */
  toDynamicUrl = this.url;
}

const getUser = new LegacyEndpoint({
  path: '/users/:id',
  queryKey: 'user',
  schema: User,
});
```

请把 `queryKey` 之类的额外成员作为选项传入，而不是通过自定义构造函数传入，这样
[`extend()`](../api/RestEndpoint.md#extend)（`resource()`、`hookifyResource()` 和 `useCancelling()` 都会用到）才能继续
正常工作。

#### 基于 context 的认证 {#context-based-auth}

当 token 来自 :react[React context]:vue[`inject()`]（Okta、Auth0）而不是存储时，`getHeaders()` 无法
读取它们。使用 [`hookifyResource()`](../api/hookifyResource.md) 通过
:react[hook]:vue[组合式函数]添加请求头。这一模式及其他模式请参阅
[认证指南](./auth.md)。

### 4. 定义 entity 和 resource {#entities}

codemod 生成的 endpoint 不带 `schema`。为 API 返回的每种类型定义一个 [Entity](../api/Entity.md)：它的
字段、字段类型以及主键。用一个 [`resource()`](../api/resource.md) 替换每个模块中针对同一路径的
CRUD 函数：

<DiffEditor caption="一个 `resource()` 就能替换一整个模块的 CRUD 函数，`schema` 则为每个响应提供类型。">

```ts title="Before"
import api from './api';

export interface Post {
  id: string;
  title: string;
  body: string;
}

export const getPosts = () => api.get<Post[]>('/posts');
export const getPost = (id: string) => api.get<Post>(`/posts/${id}`);
export const createPost = (data: Omit<Post, 'id'>) =>
  api.post<Post>('/posts', data);
export const updatePost = (id: string, data: Partial<Post>) =>
  api.patch<Post>(`/posts/${id}`, data);
export const deletePost = (id: string) => api.delete(`/posts/${id}`);
```

```ts title="After"
import { Entity, resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';

export class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}

// callout: Gives `getList`, `get`, `getList.push`, `update`, `partialUpdate` and `delete`, all typed.
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  Endpoint: ApiEndpoint,
});
```

</DiffEditor>

针对 mock API 试试结果：

<EndpointPlayground input="https://api.example.com/posts/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'X-API-Key': 'my-key'}}} status={200} response={{ "id": "1", "title": "Hello World", "body": "First post" }}>

```ts title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}
```

```ts title="ApiEndpoint" collapsed
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'X-API-Key': 'my-key',
    };
  }
}
```

```ts title="PostResource"
import { resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';
import Post from './Post';

export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  Endpoint: ApiEndpoint,
});
```

```ts title="Usage" column
import { PostResource } from './PostResource';
PostResource.get({ id: '1' });
```

</EndpointPlayground>

像 `/projects/:projectId/tasks/:taskId` 这样的嵌套路径应有自己的 resource。独立的 `new ApiEndpoint()` 留给
非 CRUD 操作，例如搜索、自定义操作和认证。

:::warning

不要定义了 Entity 类，却在 endpoint 上不设置 `schema`：没有 `schema`，响应会失去
类型，并且在你采用 store 时它也无法规范化这些响应。

:::

#### 非标准的主键 {#non-standard-primary-keys}

许多 API（例如 MongoDB）使用 `_id` 而不是 `id`。覆盖 [`pk()`](../api/Entity.md#pk)：

```ts
import { Entity } from '@data-client/rest';

export class User extends Entity {
  _id = '';
  name = '';
  email = '';
  static key = 'User';

  pk() {
    return this._id;
  }
}
```

#### Body 类型 {#body-typing}

用 `body: {} as BodyType` 为独立的 `POST`、`PUT` 和 `PATCH` endpoint 的 body 标注类型。不要使用
`undefined as unknown as BodyType`：`RestEndpoint` 会把 [`body`](../api/RestEndpoint.md#body)`: undefined` 视为
没有 body 参数。[`resource()`](../api/resource.md) 会自行为其 endpoint 的 body 标注类型。

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

#### 与 Zod 或 Yup 共存 {#coexisting-with-zod-or-yup}

如果代码库已经在用 Zod 或 Yup 校验响应，请为每种类型选择一种方案：

- **在 `process()` 中使用 Zod**（推荐）：通过在
  [`process()`](../api/RestEndpoint.md#process) 中解析来保留运行时校验，并让 Entity 负责规范化：

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **用 Entity 取代 Zod**：把字段结构移到 Entity 类中，并删除 Zod schema。Entity 的字段只提供
  类型，不做运行时检查，因此对于服务器可能发送格式错误的字段，请添加
  [`static validate()`](../api/Entity.md#validate)。
- **只用 Zod，不用 Entity**：不设置 `schema`，手动解析。只对无法从
  规范化中获益的 endpoint（认证 token、一次性响应）这样做。

### 5. 更新调用处 {#call-sites}

组件和服务保留各自的加载逻辑和状态；只有调用会改变。

<DiffEditor caption="endpoint 会解析为解析后的 body，因此 `.data` 不再需要，参数也合并为一个对象。">

```ts title="Before"
import { createPost, getPost, getPosts } from './api/posts';

const { data: posts } = await getPosts();
const { data: post } = await getPost('1');
const { data: created } = await createPost({ title: 'Hello', body: '' });
```

```ts title="After"
import { PostResource } from './api/posts';

const posts = await PostResource.getList();
const post = await PostResource.get({ id: '1' });
const created = await PostResource.getList.push({
  title: 'Hello',
  body: '',
});
```

</DiffEditor>

通过 store（借助 [`useSuspense()`](/docs/api/useSuspense) 和规范化缓存）读取这些 endpoint，是你之后可以
单独进行的一步；参见[数据依赖](/docs/getting-started/data-dependency)。

### 6. 迁移错误处理 {#error-handling}

<DiffEditor caption="`NetworkError` 提供 `status` 和原始的 `Response`，取代 axios 的 `error.response`。">

```ts title="Before"
import axios from 'axios';
import { getPost } from './api/posts';

try {
  const { data } = await getPost('1');
} catch (err) {
  if (axios.isAxiosError(err)) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}
```

```ts title="After"
import { NetworkError } from '@data-client/rest';
import { PostResource } from './api/posts';

try {
  const post = await PostResource.get({ id: '1' });
} catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);
    console.log(err.response);
  }
}
```

</DiffEditor>

在基础 endpoint 中从 body 读取一次服务器的错误消息；参见
[服务器错误消息](#server-error-messages)。

### 7. 移除 axios {#remove-axios}

搜索仍在使用 axios 的地方：

| 模式                                       | 查找目标                  |
| ------------------------------------------ | ------------------------- |
| `TODO\(data-client\)`                      | codemod 遗留的内容        |
| `import.*from ['"]axios['"]`               | import 语句               |
| `axios\.create`                            | 实例创建                  |
| `axios\.(get\|post\|put\|patch\|delete)`   | 直接调用                  |
| `\.interceptors\.(request\|response)\.use` | interceptor               |
| `isAxiosError`                             | 错误处理                  |
| `cancelToken\|CancelToken`                 | 取消（已弃用）            |
| `onUploadProgress\|onDownloadProgress`     | 进度回调                  |

借助下面的[参考](#quick-reference)迁移每一处匹配。全部迁移完后，卸载 axios，然后运行
类型检查和测试：

```bash
npm uninstall axios
```

## Axios 选项参考 {#quick-reference}

| Axios                                    | @data-client/rest                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                   |
| `headers` 配置                           | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                               |
| `interceptors.request`                   | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) / [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)         |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                       |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                     |
| `isAxiosError` / `error.response`        | 带有 `.status` 和 `.response` 的 [`NetworkError`](#error-handling)                                                  |
| `cancelToken` / `signal`                 | [`signal`](#cancellation)                                                                                         |
| `timeout`                                | 在 `getRequestInit()` 中使用 [`AbortSignal.timeout()`](#timeout)                                                    |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](#binary-responses) / `'arrayBuffer'`                                                          |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](#query-serialization)                |
| `auth: { username, password }`           | [配合 `btoa()` 使用 `getHeaders()`](#basic-auth)                                                                  |
| `validateStatus`                         | [自定义 `fetchResponse()`](#accepting-error-statuses)                                                             |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](#csrf-headers)                                                                                   |
| `onUploadProgress`                       | [使用 XMLHttpRequest 的自定义 `fetchResponse()`](#upload-progress)                                                  |

### 取消 {#cancellation}

axios 的 `signal` 和已弃用的 `CancelToken` 都对应于
[AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 的 `signal`：

<DiffEditor>

```ts title="Before"
const source = axios.CancelToken.source();
axios.get('/users/1', { cancelToken: source.token });
source.cancel();
```

```ts title="After"
const getUser = new ApiEndpoint({ path: '/users/:id' });
const controller = new AbortController();
// callout: `extend()` gives this one request its own signal; a `signal` set when the endpoint is created would abort all of its requests.
getUser.extend({ signal: controller.signal })({ id: '1' });
controller.abort();
```

</DiffEditor>

更多模式请参阅[中止指南](./abort.md)。

### 超时 {#timeout}

<DiffEditor>

```ts title="Before"
axios.get('/users', { timeout: 5000 });
```

```ts title="After"
export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // callout: Runs for each request, so each one gets its own 5 seconds. `AbortSignal.timeout()` passed to the constructor would start counting once, when the endpoint is created.
  async getRequestInit(
    body?: RequestInit['body'] | Record<string, unknown>,
  ) {
    const init = await super.getRequestInit(body);
    const timeout = AbortSignal.timeout(5000);
    // callout: Keeps `extend({ signal })` cancellation working: either signal aborts the request.
    const signal = init.signal
      ? AbortSignal.any([init.signal, timeout])
      : timeout;
    return { ...init, signal };
  }
}
```

</DiffEditor>

### 二进制响应 {#binary-responses}

<DiffEditor>

```ts title="Before"
axios.get('/files/1', { responseType: 'blob' });
```

```ts title="After"
const downloadFile = new RestEndpoint({
  path: '/files/:id',
  content: 'blob',
});
```

</DiffEditor>

[`content`](../api/RestEndpoint.md#content) 也接受 `'arrayBuffer'` 和 `'text'`。如何触发浏览器下载，请参阅
[文件下载](./network-transform.md#file-download)。

### 查询参数序列化 {#query-serialization}

<DiffEditor>

```ts title="Before"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

```ts title="After"
export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  searchToString(searchParams: Record<string, any>) {
    return qs.stringify(searchParams, {
      arrayFormat: 'repeat',
      skipNulls: true,
    });
  }
}
```

</DiffEditor>

axios 会省略值为 `null` 和 `undefined` 的参数，但默认的 `searchToString()` 使用
[URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)，它会把它们作为字符串
`"null"` 和 `"undefined"` 发送；上面的 `skipNulls` 会去掉它们。参见 [`searchToString()`](../api/RestEndpoint.md#searchToString)。

### Basic 认证 {#basic-auth}

<DiffEditor>

```ts title="Before"
axios.get('/api', { auth: { username: 'user', password: 'pass' } });
```

```ts title="After"
export default class BasicAuthEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Basic ${btoa('user:pass')}`,
    };
  }
}
```

</DiffEditor>

### 接受错误状态码 {#accepting-error-statuses}

对于任何不是 `ok` 的状态码，[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 都会抛出
[`NetworkError`](#error-handling)。覆盖它即可改变哪些情况算作错误：

<DiffEditor>

```ts title="Before"
axios.get('/api', { validateStatus: status => status < 500 });
```

```ts title="After"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class LenientEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    const response = await fetch(input, init);
    if (response.status >= 500) throw new NetworkError(response);
    return response;
  }
}
```

</DiffEditor>

### CSRF 请求头 {#csrf-headers}

```ts title="Before"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

对于不是 `GET` 的请求，在 [`getHeaders()`](../api/RestEndpoint.md#getHeaders) 中读取 cookie。完整的 endpoint 类请参阅
[Django 集成](./django.md)。

### 上传进度 {#upload-progress}

`fetch` 无法报告上传进度，因此需要在
[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 中使用
[XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)。`onProgress` 字段和
其他成员一样，作为 endpoint 选项传入。

```ts title="Before"
axios.post('/upload', formData, {
  onUploadProgress: e => console.log(e.loaded / e.total),
});
```

```ts title="UploadEndpoint.ts"
import {
  NetworkError,
  RestEndpoint,
  RestGenerics,
} from '@data-client/rest';

export default class UploadEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  declare onProgress?: (progress: number) => void;

  fetchResponse(input: RequestInfo, init: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();
      const abortError = () =>
        new DOMException('The operation was aborted.', 'AbortError');
      if (init.signal?.aborted) return reject(abortError());
      init.signal?.addEventListener('abort', abort, { once: true });

      xhr.open(
        init.method ?? 'POST',
        typeof input === 'string' ? input : input.url,
      );
      new Headers(init.headers).forEach((value, key) =>
        xhr.setRequestHeader(key, value),
      );
      xhr.onloadend = () =>
        init.signal?.removeEventListener('abort', abort);
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) this.onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        const headers = new Headers();
        for (const line of xhr
          .getAllResponseHeaders()
          .trim()
          .split(/\r?\n/)) {
          const [key, ...rest] = line.split(': ');
          if (key) headers.append(key, rest.join(': '));
        }
        // 204, 205 and 304 responses can't have a body
        const body = [204, 205, 304].includes(xhr.status)
          ? null
          : xhr.response;
        const response = new Response(body, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers,
        });
        if (response.ok) resolve(response);
        else reject(new NetworkError(response));
      };
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.onabort = () => reject(abortError());
      xhr.send(init.body as XMLHttpRequestBodyInit | null);
    });
  }
}

const uploadFile = new UploadEndpoint({
  path: '/upload',
  method: 'POST',
  body: {} as FormData,
  onProgress: (progress: number) => console.log(progress),
});
```

## 相关指南 {#related-guides}

- [认证](./auth.md)：token 与 cookie 认证模式
- [中止 Fetch](./abort.md)：取消与防抖
- [在获取时转换数据](./network-transform.md)：响应转换、字段重命名、文件下载
- [Django 集成](./django.md)：Django 的 CSRF 与 cookie 认证
