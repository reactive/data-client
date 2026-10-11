---
title: 从 Axios 迁移到 Reactive Data Client
sidebar_label: Axios 迁移
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import SkillTabs from '@site/src/components/SkillTabs';
import SiteOnly from '@site/src/components/SiteOnly';

# 从 Axios 迁移

[`@data-client/rest`](/rest) 用一种声明式、类型安全的 REST API 方案取代 axios。

<SiteOnly>

## AI 辅助迁移 {#skill}

安装 REST setup skill，即可借助你的 AI 编程助手自动完成迁移。它会自动检测项目中的 axios，并运行 [codemod](#codemod) 进行确定性的转换，然后引导你完成需要人工判断的手动步骤（interceptor、错误处理、schema 定义等）。

<SkillTabs repo="reactive/data-client" skills={['data-client-schema', 'data-client-rest-setup', 'data-client-rest']} />

然后运行 skill `/data-client-rest-setup` 开始迁移。它会检测 axios 并自动应用相应的迁移子流程。

</SiteOnly>

## 为什么要迁移？ {#why-migrate}

### 类型安全的路径 {#type-safe-paths}

使用 axios 时，API 路径只是不透明的字符串——拼写错误和缺失的参数只有在运行时才会被发现：

```ts
// axios: no type checking — typo silently produces wrong URL
axios.get(`/users/${usrId}`);
```

使用 [`RestEndpoint`](../api/RestEndpoint.md) 时，路径参数会从 `path` 模板中推断出来，并在编译时强制检查：

```ts
const getUser = new RestEndpoint({ path: '/users/:id', schema: User });
// TypeScript enforces { id: string } — typos are compile errors
getUser({ id: '1' });
```

这也意味着 IDE 能为每个路径参数提供自动补全。

### 其他好处 {#additional-benefits}

- **规范化缓存**——共享的 Entity 会被去重，并在所有地方自动更新
- **声明式数据依赖**——组件通过 [`useSuspense()`](/docs/api/useSuspense) 声明它们需要什么数据，而不是如何获取
- **乐观更新**——在服务器响应之前即时给出 UI 反馈
- **零样板代码**——[`resource()`](../api/resource.md) 只需 `path` 和 `schema` 就能生成完整的 CRUD API

## 速查表 {#quick-reference}

| Axios                                    | @data-client/rest                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                                                          |
| `headers` 配置                           | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                                                                      |
| `interceptors.request`                   | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) / [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                        |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)                                                |
| `timeout`                                | 通过 `signal` 使用 [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)                                      |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](../api/RestEndpoint.md#searchToString)                                      |
| `cancelToken` / `signal`                 | `signal` ([AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController))                                                           |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](../api/RestEndpoint.md#content) / `'arrayBuffer'`——参见[文件下载](./network-transform.md#file-download)                        |
| `auth: { username, password }`           | 配合 `btoa()` 使用 [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                                                        |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)——参见 [Django 集成](./django.md)                                                              |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                                                              |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                                                            |
| `validateStatus`                         | 自定义 [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse)                                                                                         |
| `onUploadProgress`                       | 使用 [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) 的自定义 [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) |
| `isAxiosError` / `error.response`        | 带有 `.status` 和 `.response` 的 [`NetworkError`](../api/RestEndpoint.md#fetchResponse)                                                                    |

## 迁移示例 {#migration-examples}

### 基本的 GET {#basic-get}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

export const getUser = (id: string) =>
  axios.get(`https://api.example.com/users/${id}`);
```

```ts title="usage.ts"
const { data } = await getUser('1');
```

</TabItem>
<TabItem value="after">

<EndpointPlayground input="https://api.example.com/users/1" init={{method: 'GET', headers: {'Content-Type': 'application/json'}}} status={200} response={{ "id": "1", "username": "alice", "email": "alice@example.com" }}>

```ts title="User" collapsed
import { Entity } from '@data-client/rest';

export default class User extends Entity {
  id = '';
  username = '';
  email = '';
  static key = 'User';
}
```

```ts title="api"
import { RestEndpoint } from '@data-client/rest';
import User from './User';

export const getUser = new RestEndpoint({
  urlPrefix: 'https://api.example.com',
  path: '/users/:id',
  schema: User,
});
```

```ts title="Usage" column
import { getUser } from './api';
getUser({ id: '1' });
```

</EndpointPlayground>

</TabItem>
</Tabs>

### 带有 base URL 和请求头的实例 {#instance-with-base-url-and-headers}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'my-key' },
});

export const getPost = (id: string) => api.get(`/posts/${id}`);
export const createPost = (data: any) => api.post('/posts', data);
```

</TabItem>
<TabItem value="after">

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

```ts title="ApiEndpoint"
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

```ts title="PostResource" collapsed
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

</TabItem>
</Tabs>

### POST 变更 {#post-mutation}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

const api = axios.create({ baseURL: 'https://api.example.com' });

export const createPost = (data: { title: string; body: string }) =>
  api.post('/posts', data);
```

</TabItem>
<TabItem value="after">

<EndpointPlayground input="https://api.example.com/posts" init={{method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{"title":"New Post","body":"Content"}'}} status={201} response={{ "id": "2", "title": "New Post", "body": "Content" }}>

```ts title="Post" collapsed
import { Entity } from '@data-client/rest';

export default class Post extends Entity {
  id = '';
  title = '';
  body = '';
  static key = 'Post';
}
```

```ts title="PostResource"
import { resource } from '@data-client/rest';
import Post from './Post';

export const PostResource = resource({
  urlPrefix: 'https://api.example.com',
  path: '/posts/:id',
  schema: Post,
});
```

```ts title="Usage" column
import { PostResource } from './PostResource';
PostResource.getList.push({
  title: 'New Post',
  body: 'Content',
});
```

</EndpointPlayground>

</TabItem>
</Tabs>

### Interceptor → 生命周期方法 {#interceptors--lifecycle-methods}

Axios 的 interceptor 对应于 [RestEndpoint](../api/RestEndpoint.md) 的生命周期方法：

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts title="api.ts"
import axios from 'axios';

const api = axios.create({ baseURL: 'https://api.example.com' });

// Request interceptor — add auth token
api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

// Response interceptor — unwrap .data
api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error),
);
```

</TabItem>
<TabItem value="after">

```ts title="ApiEndpoint.ts"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  // Equivalent to request interceptor
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Bearer ${getToken()}`,
    };
  }

  // Equivalent to response interceptor (unwrap/transform)
  process(value: any, ...args: any) {
    return value;
  }
}
```

</TabItem>
</Tabs>

:::tip

`RestEndpoint` 默认就会返回解析后的 JSON——无需 interceptor 来解包 `response.data`。

:::

转换响应体的响应 interceptor（例如转换 `snake_case` 键名）应放在 [`process()`](../api/RestEndpoint.md#process) 中。完整示例请参阅 [snake 转 camel](./network-transform.md#snakes-to-camels)。

### 错误处理 {#error-handling}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts
import axios from 'axios';

try {
  const { data } = await axios.get('/users/1');
} catch (err) {
  if (axios.isAxiosError(err)) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}
```

</TabItem>
<TabItem value="after">

```ts
import { NetworkError } from '@data-client/rest';

try {
  const user = await getUser({ id: '1' });
} catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);
    console.log(err.response);
  }
}
```

[`NetworkError`](../api/RestEndpoint.md#fetchResponse) 提供 `.status` 和 `.response`（原始的 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 对象）。如需在服务器错误时进行软重试，请参阅 [`errorPolicy`](../api/RestEndpoint.md#errorpolicy)。

</TabItem>
</Tabs>

#### 服务器错误消息 {#server-error-messages}

Axios 代码库通常会把 `error.response.data.error` 或 `.message` 展示给用户。改为在基类的 [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 中从 `Response` 的 body 读取一次，这样调用处无需解析 body，直接从 `error.message` 获取即可：

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

### 取消 {#cancellation}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts
import axios from 'axios';

const controller = new AbortController();
axios.get('/users', { signal: controller.signal });
controller.abort();
```

或者使用已弃用的 `CancelToken`：

```ts
const source = axios.CancelToken.source();
axios.get('/users', { cancelToken: source.token });
source.cancel();
```

</TabItem>
<TabItem value="after">

两者都对应于 [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) 的 `signal`。[`useCancelling()`](/docs/api/useCancelling) hook 会在参数变化时自动取消进行中的请求：

```tsx
import { useSuspense } from '@data-client/react';
import { useCancelling } from '@data-client/react';
import { searchEndpoint } from './api/search';
import ResultsList from './ResultsList';

function SearchResults({ query }: { query: string }) {
  const results = useSuspense(useCancelling(searchEndpoint), { q: query });
  return <ResultsList results={results} />;
}
```

如需手动取消，直接传入 `signal`：

```ts
const controller = new AbortController();
const getUser = new RestEndpoint({
  path: '/users/:id',
  signal: controller.signal,
});
controller.abort();
```

</TabItem>
</Tabs>

更多模式请参阅[中止指南](./abort.md)。

### 超时 {#timeout}

```ts title="Before (axios)"
axios.get('/users', { timeout: 5000 });
```

```ts title="After (data-client)"
const getUsers = new RestEndpoint({
  path: '/users',
  signal: AbortSignal.timeout(5000),
});
```

### 二进制响应 {#binary-responses}

```ts title="Before (axios)"
axios.get('/files/1', { responseType: 'blob' });
```

把 [`content`](../api/RestEndpoint.md#content) 设置为 `'blob'`、`'arrayBuffer'` 或 `'text'`。完整的 endpoint 以及如何触发浏览器下载，请参阅[文件下载](./network-transform.md#file-download)。

### 查询参数序列化 {#query-serialization}

```ts title="Before (axios)"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

覆盖 [`searchToString()`](../api/RestEndpoint.md#searchToString) 以使用 `qs` 进行序列化；参见[使用 `qs` 库](../api/RestEndpoint.md#searchToString)。

### Basic 认证 {#basic-auth}

```ts title="Before (axios)"
axios.get('/api', { auth: { username: 'user', password: 'pass' } });
```

```ts title="After (data-client)"
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

### 接受错误状态码 {#accepting-error-statuses}

对于任何非 `ok` 的状态码，[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 都会抛出 [`NetworkError`](../api/RestEndpoint.md#fetchResponse)。覆盖它即可改变哪些情况算作错误：

```ts title="Before (axios)"
axios.get('/api', { validateStatus: status => status < 500 });
```

```ts title="After (data-client)"
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

### CSRF 请求头 {#csrf-headers}

```ts title="Before (axios)"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

对于非 `GET` 请求，在 [`getHeaders()`](../api/RestEndpoint.md#getHeaders) 中读取 cookie。完整的 endpoint 类请参阅 [Django 集成](./django.md)。

### 上传进度 {#upload-progress}

`fetch` 无法报告上传进度，因此需要在 [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 中使用 [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)。`onProgress` 字段和其他成员一样，作为 endpoint 选项传入。

```ts title="Before (axios)"
axios.post('/upload', formData, {
  onUploadProgress: e => console.log(e.loaded / e.total),
});
```

```ts title="After (data-client)"
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

## Codemod {#codemod}

一个独立的 [jscodeshift](https://github.com/facebook/jscodeshift) codemod 负责迁移中机械性的部分。<SiteOnly> 在不使用 AI 的工作流中可以自己运行它；上面的 [AI skill](#skill) 会在第一步自动运行它。</SiteOnly>

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

codemod 会自动：

- 把 `import axios from 'axios'` 替换为 `import { RestEndpoint } from '@data-client/rest'`
- 把 `axios.create({ baseURL, headers })` 转换为带有 `urlPrefix` 和 `getHeaders()` 的 `RestEndpoint` 基础子类
- 把 `axios.get()`、`.post()`、`.put()`、`.patch()`、`.delete()` 转换为 `new RestEndpoint({ path, method })`
- 把对已创建实例的调用（`api.post()`，其中 `api = axios.create(...)`）转换为 `new CreatedClassName({ path, method })`

如果项目把 axios 封装在自己的类或函数中，从不直接调用 `axios.get()`/`.post()`，或者只调用不带方法名的 `axios(config)`，codemod 就没什么可做的。这种情况下，跳过它，直接从[手动步骤](#after-the-codemod)开始。

codemod **不会**处理：

- Interceptor——参见[生命周期方法](#interceptors--lifecycle-methods)
- 错误处理（`isAxiosError`、`error.response`）——参见[错误处理](#error-handling)
- [速查表](#quick-reference)中的其余内容——参见上面的[迁移示例](#migration-examples)
- [Entity](../api/Entity.md) schema 定义，以及把调用处转换为 hook——参见[下文](#after-the-codemod)

### 查找剩余的 axios 用法 {#finding-remaining-axios-usage}

用于定位仍需迁移之处的搜索模式：

| 模式                                       | 查找目标                  |
| ------------------------------------------ | ------------------------- |
| `import.*from ['"]axios['"]`               | import 语句               |
| `axios\.create`                            | 实例创建                  |
| `axios\.(get\|post\|put\|patch\|delete)`   | 直接调用                  |
| `\.interceptors\.(request\|response)\.use` | interceptor               |
| `isAxiosError`                             | 错误处理                  |
| `cancelToken\|CancelToken`                 | 取消（已弃用）            |
| `onUploadProgress\|onDownloadProgress`     | 进度回调                  |

## 运行 codemod 之后 {#after-the-codemod}

codemod 生成的 endpoint 不带 schema。定义 [Entity](../api/Entity.md) schema 并将其连接到 endpoint，才能启用规范化和缓存——这正是 Reactive Data Client 的核心价值。

### 非标准的主键 {#non-standard-primary-keys}

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

### 用 resource() 组织 CRUD endpoint {#group-crud-endpoints-with-resource}

当某个 axios 模块针对同一路径有单独的 `getUsers`、`getUser`、`createUser`、`updateUser` 和 `deleteUser` 函数时，用一个 [`resource()`](../api/resource.md) 替换它们：

```ts
import { resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';
import { User } from './User';

export const UserResource = resource({
  path: '/users/:id',
  schema: User,
  Endpoint: ApiEndpoint,
});
// UserResource.getList, .get, .getList.push, .update, .partialUpdate, .delete
```

像 `/projects/:projectId/tasks/:taskId` 这样的嵌套路径应有自己的 resource。独立的 `new ApiEndpoint()` 只留给非 CRUD 操作（搜索、自定义操作、认证）。

### 与 Zod 或 Yup 共存 {#coexisting-with-zod-or-yup}

如果代码库已经在用 Zod 或 Yup 校验响应，请为每种类型选择一种方案：

- **在 `process()` 中使用 Zod**（推荐）：通过在 [`process()`](../api/RestEndpoint.md#process) 中解析来保留运行时校验，并让 Entity 负责规范化：

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **用 Entity 取代 Zod**：把字段结构移到 Entity 类中，并删除 Zod schema。Entity 的字段只提供类型，不做运行时检查，因此对于服务器可能发送格式错误的字段，请添加 [`static validate()`](../api/Entity.md#validate)。
- **只用 Zod，不用 Entity**：不设置 `schema`，手动解析。只对无法从规范化中获益的 endpoint（认证 token、一次性响应）这样做。

:::warning

不要定义了 Entity 类，却在每个 endpoint 上都不设置 `schema`——没有 `schema`，什么都不会被规范化，迁移相比 axios 也就收效甚微。

:::

### Body 类型 {#body-typing}

用 `body: {} as BodyType` 为独立的 `POST`/`PUT`/`PATCH` endpoint 的 body 标注类型。不要使用 `undefined as unknown as BodyType`：`RestEndpoint` 会把 [`body`](../api/RestEndpoint.md#body)`: undefined` 视为没有 body 参数。

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

[`resource()`](../api/resource.md) 会自动为其 CRUD endpoint 标注类型。

### 把调用处转换为 hook {#convert-call-sites-to-hooks}

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```tsx
import { useEffect, useState } from 'react';
import api from './lib/api';
import { Spinner } from './Spinner';
import type { User } from './User';

function UserProfile({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    api.get(`/users/${id}`).then(({ data }) => setUser(data));
  }, [id]);
  if (!user) return <Spinner />;
  return <h1>{user.name}</h1>;
}
```

</TabItem>
<TabItem value="after">

```tsx
import { useSuspense } from '@data-client/react';
import { UserResource } from './UserResource';

function UserProfile({ id }: { id: string }) {
  const user = useSuspense(UserResource.get, { id });
  return <h1>{user.name}</h1>;
}
```

</TabItem>
</Tabs>

加载和错误状态转移到 [`AsyncBoundary`](/docs/api/AsyncBoundary) 中处理。详情请参阅 [`useSuspense()`](/docs/api/useSuspense)。

### 基于 context 的认证 {#context-based-auth}

当 token 来自 React context（Okta、Auth0）而不是存储时，使用 [`hookifyResource()`](../api/hookifyResource.md) 通过 hook 注入请求头。这一模式及其他模式请参阅[认证指南](./auth.md)。

### 渐进式迁移 {#gradual-migration}

如果应用使用 TanStack Query 或 SWR，且无法一次性全部转换，可以暂时保留这些 hook，但通过 [`controller.fetch()`](/docs/api/Controller#fetch) 进行获取。直接调用 endpoint 只会执行它的 fetch；而通过 Controller 调用还会把响应规范化到共享缓存中，因此从第一天起数据就是一致的：

```ts
import { useController } from '@data-client/react';
import { useQuery } from '@tanstack/react-query';
import ApiEndpoint from './ApiEndpoint';
import { Project } from './Project';

export const getProject = new ApiEndpoint({
  path: '/projects/:id',
  schema: Project,
});

export function useProject(id: string) {
  const ctrl = useController();
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => ctrl.fetch(getProject, { id }),
  });
}
```

之后，再把 `useProject(id)` 替换为 `useSuspense(getProject, { id })`。

### 已有的 endpoint 抽象 {#existing-endpoint-abstractions}

如果代码库已经有一个封装了 axios 的自定义 endpoint 类（比如带有 `path`、`method` 和 `toDynamicUrl()` 辅助方法），可以让它继承 `RestEndpoint` 而不是替换它，这样既保留了向后兼容的方法，又获得了 [`url()`](../api/RestEndpoint.md#url)、[`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)、[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) 和 [`parseResponse()`](../api/RestEndpoint.md#parseResponse)：

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

请把 `queryKey` 之类的额外成员作为选项传入，而不是通过自定义构造函数传入，这样 [`extend()`](../api/RestEndpoint.md#extend)（`resource()`、`hookifyResource()` 和 `useCancelling()` 都会用到）才能继续正常工作。

## 相关指南 {#related-guides}

- [认证](./auth.md)——token 与 cookie 认证模式
- [中止 Fetch](./abort.md)——取消与防抖
- [在获取时转换数据](./network-transform.md)——响应转换、字段重命名、文件下载
- [Django 集成](./django.md)——Django 的 CSRF 与 cookie 认证
