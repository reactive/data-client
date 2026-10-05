---
title: Migrating from Axios to Reactive Data Client
sidebar_label: Axios Migration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import SkillTabs from '@site/src/components/SkillTabs';

# Migrating from Axios

[`@data-client/rest`](/rest) replaces axios with a declarative, type-safe approach to REST APIs.

## AI-assisted migration {#skill}

Install the REST setup skill to automate the migration with your AI coding assistant. It auto-detects axios in your project and runs the [codemod](#codemod) for deterministic transforms, then guides you through the manual steps that require judgment (interceptors, error handling, schema definitions, etc.).

<SkillTabs repo="reactive/data-client" skills={['data-client-schema', 'data-client-rest-setup', 'data-client-rest']} />

Then run skill `/data-client-rest-setup` to start the migration. It will detect axios and apply the appropriate migration sub-procedure automatically.

## Why migrate?

### Type-safe paths

With axios, API paths are opaque strings — typos and missing parameters are only caught at runtime:

```ts
// axios: no type checking — typo silently produces wrong URL
axios.get(`/users/${usrId}`);
```

With [`RestEndpoint`](../api/RestEndpoint.md), path parameters are inferred from the `path` template and enforced at compile time:

```ts
const getUser = new RestEndpoint({ path: '/users/:id', schema: User });
// TypeScript enforces { id: string } — typos are compile errors
getUser({ id: '1' });
```

This also means IDE autocomplete works for every path parameter.

### Additional benefits

- **Normalized cache** — shared entities are deduplicated and updated everywhere automatically
- **Declarative data dependencies** — components declare what data they need via [`useSuspense()`](/docs/api/useSuspense), not how to fetch it
- **Optimistic updates** — instant UI feedback before the server responds
- **Zero boilerplate** — [`resource()`](../api/resource.md) generates a full CRUD API from a `path` and `schema`

## Quick reference

| Axios                                    | @data-client/rest                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseURL`                                | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix)                                                                                                          |
| `headers` config                         | [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                                                                                      |
| `interceptors.request`                   | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) / [`getHeaders()`](../api/RestEndpoint.md#getHeaders)                                        |
| `interceptors.response`                  | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process)                                                |
| `timeout`                                | [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) via `signal`                                      |
| `params` / `paramsSerializer`            | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](../api/RestEndpoint.md#searchToString)                                      |
| `cancelToken` / `signal`                 | `signal` ([AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController))                                                           |
| `responseType: 'blob'` / `'arraybuffer'` | [`content: 'blob'`](../api/RestEndpoint.md#content) / `'arrayBuffer'` — see [file download](./network-transform.md#file-download)                        |
| `auth: { username, password }`           | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) with `btoa()`                                                                                        |
| `xsrfCookieName` / `xsrfHeaderName`      | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) — see [Django Integration](./django.md)                                                              |
| `transformRequest`                       | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit)                                                                                              |
| `transformResponse`                      | [`process()`](../api/RestEndpoint.md#process)                                                                                                            |
| `validateStatus`                         | Custom [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse)                                                                                         |
| `onUploadProgress`                       | Custom [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) using [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) |
| `isAxiosError` / `error.response`        | [`NetworkError`](../api/RestEndpoint.md#fetchResponse) with `.status` and `.response`                                                                    |

## Migration examples

### Basic GET

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

### Instance with base URL and headers

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

### POST mutation

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

### Interceptors → lifecycle methods

Axios interceptors map to [RestEndpoint](../api/RestEndpoint.md) lifecycle methods:

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

`RestEndpoint` already returns parsed JSON by default — no interceptor needed to unwrap `response.data`.

:::

Response interceptors that transform the body map to [`process()`](../api/RestEndpoint.md#process):

```ts title="Before (axios)"
api.interceptors.response.use(response => {
  response.data = camelizeKeys(response.data);
  return response;
});
```

```ts title="After (data-client)"
export default class ApiEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  process(value: any, ...args: any) {
    return camelizeKeys(value);
  }
}
```

### Error handling

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

[`NetworkError`](../api/RestEndpoint.md#fetchResponse) provides `.status` and `.response` (the raw [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object). To read the body, use `await err.response.clone().json()` or `.text()` — always `.clone()` first, since a body can only be consumed once. For soft retries on server errors, see [`errorPolicy`](../api/RestEndpoint.md#errorpolicy).

</TabItem>
</Tabs>

#### Server error messages

Axios codebases commonly surface `error.response.data.error` or `.message` to the user. Read it from the `Response` body instead:

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```ts
import { isAxiosError } from 'axios';

if (isAxiosError(error) && error.response) {
  throw new Error(error.response.data.error);
}
```

</TabItem>
<TabItem value="after">

```ts
import { NetworkError } from '@data-client/rest';

if (error instanceof NetworkError) {
  const body = await error.response.clone().json();
  throw new Error(body.error ?? error.response.statusText);
}
```

</TabItem>
</Tabs>

When this is repeated across many call sites, centralize it in the base class's [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) so they no longer need `try`/`catch`:

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
        if (body?.error) throw new Error(body.error);
        if (body?.message) throw new Error(body.message);
      }
      throw error;
    }
  }
}
```

### Cancellation

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

Or with the deprecated `CancelToken`:

```ts
const source = axios.CancelToken.source();
axios.get('/users', { cancelToken: source.token });
source.cancel();
```

</TabItem>
<TabItem value="after">

Both map to an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) `signal`. The [`useCancelling()`](/docs/api/useCancelling) hook automatically cancels in-flight requests when parameters change:

```tsx
import { useSuspense } from '@data-client/react';
import { useCancelling } from '@data-client/react';

function SearchResults({ query }: { query: string }) {
  const results = useSuspense(useCancelling(searchEndpoint), { q: query });
  return <ResultsList results={results} />;
}
```

For manual cancellation, pass `signal` directly:

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

See the [abort guide](./abort.md) for more patterns.

### Timeout

```ts title="Before (axios)"
axios.get('/users', { timeout: 5000 });
```

```ts title="After (data-client)"
const getUsers = new RestEndpoint({
  path: '/users',
  signal: AbortSignal.timeout(5000),
});
```

### Binary responses

```ts title="Before (axios)"
axios.get('/files/1', { responseType: 'blob' });
```

```ts title="After (data-client)"
const downloadFile = new RestEndpoint({
  path: '/files/:id',
  content: 'blob',
  dataExpiryLength: 0,
});
```

[`content`](../api/RestEndpoint.md#content) also accepts `'arrayBuffer'` and `'text'`. See [file download](./network-transform.md#file-download) for triggering a browser download and reading `Content-Disposition`.

### Query serialization

```ts title="Before (axios)"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

```ts title="After (data-client)"
const getUsers = new RestEndpoint({
  path: '/users',
  searchParams: {} as { ids: number[] },
  searchToString(searchParams: Record<string, any>) {
    return qs.stringify(searchParams, { arrayFormat: 'repeat' });
  },
});
getUsers({ ids: [1, 2, 3] });
```

See [`searchToString()`](../api/RestEndpoint.md#searchToString).

### Basic auth

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

### Accepting error statuses

[`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) throws [`NetworkError`](../api/RestEndpoint.md#fetchResponse) for any non-`ok` status. Override it to change what counts as an error:

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

### CSRF headers

```ts title="Before (axios)"
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});
```

```ts title="After (data-client)"
export default class CsrfEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    if (this.method === 'GET') return headers;
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return {
      ...headers,
      'X-CSRFToken': match ? match[1] : '',
    };
  }
}
```

See [Django Integration](./django.md) for a complete cookie auth + CSRF setup.

### Upload progress

`fetch` cannot report upload progress, so use [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) inside [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse). The `onProgress` field is passed as an endpoint option, like any other member.

```ts title="Before (axios)"
axios.post('/upload', formData, {
  onUploadProgress: e => console.log(e.loaded / e.total),
});
```

```ts title="After (data-client)"
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export default class UploadEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  declare onProgress?: (progress: number) => void;

  fetchResponse(input: RequestInfo, init: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();
      const cleanup = () =>
        init.signal?.removeEventListener('abort', abort);
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
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) this.onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        cleanup();
        const headers = new Headers();
        for (const line of xhr
          .getAllResponseHeaders()
          .trim()
          .split(/\r?\n/)) {
          const [key, ...rest] = line.split(': ');
          if (key) headers.append(key, rest.join(': '));
        }
        resolve(
          new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers,
          }),
        );
      };
      xhr.onerror = () => {
        cleanup();
        reject(new TypeError('Network request failed'));
      };
      xhr.onabort = () => {
        cleanup();
        reject(abortError());
      };
      xhr.send(init.body as XMLHttpRequestBodyInit | null);
    });
  }
}

const uploadFile = new UploadEndpoint({
  path: '/upload',
  method: 'POST',
  body: {} as FormData,
  onProgress: progress => console.log(progress),
});
```

## Codemod {#codemod}

For non-AI workflows, a standalone [jscodeshift](https://github.com/facebook/jscodeshift) codemod handles the mechanical parts of migration. (The [AI skill](#skill) above runs this automatically as its first step.)

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

The codemod automatically:

- Replaces `import axios from 'axios'` with `import { RestEndpoint } from '@data-client/rest'`
- Converts `axios.create({ baseURL, headers })` into a base `RestEndpoint` subclass with `urlPrefix` and `getHeaders()`
- Transforms `axios.get()`, `.post()`, `.put()`, `.patch()`, `.delete()` into `new RestEndpoint({ path, method })`
- Transforms calls on a created instance (`api.post()` where `api = axios.create(...)`) into `new CreatedClassName({ path, method })`

The codemod has little to do when the project wraps axios in its own class or function and never calls `axios.get()`/`.post()` directly, or only calls `axios(config)` without a method name. In those cases, skip it and start with [the manual steps](#after-the-codemod).

The codemod does **not** handle:

- Interceptors — see [lifecycle methods](#interceptors--lifecycle-methods)
- Error handling (`isAxiosError`, `error.response`) — see [error handling](#error-handling)
- `timeout`, `cancelToken`, `responseType`, `paramsSerializer`, `auth`, `validateStatus`, `onUploadProgress` / `onDownloadProgress` — see the [migration examples](#migration-examples) above
- [Entity](../api/Entity.md) schema definitions and converting call sites to hooks — see [below](#after-the-codemod)

### Finding remaining axios usage

Search patterns for locating what still needs migrating:

| Pattern                                    | Finds                     |
| ------------------------------------------ | ------------------------- |
| `import.*from ['"]axios['"]`               | import statements         |
| `axios\.create`                            | instance creation         |
| `axios\.(get\|post\|put\|patch\|delete)`   | direct calls              |
| `\.interceptors\.(request\|response)\.use` | interceptors              |
| `isAxiosError`                             | error handling            |
| `cancelToken\|CancelToken`                 | cancellation (deprecated) |
| `onUploadProgress\|onDownloadProgress`     | progress callbacks        |

## After the codemod {#after-the-codemod}

The codemod produces endpoints without schemas. Defining [Entity](../api/Entity.md) schemas and wiring them to endpoints enables normalization and caching — the core value of Reactive Data Client.

### Non-standard primary keys

Many APIs (MongoDB, for example) use `_id` instead of `id`. Override [`pk()`](../api/Entity.md#pk):

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

### Group CRUD endpoints with resource()

When an axios module has separate `getUsers`, `getUser`, `createUser`, `updateUser` and `deleteUser` functions for one path, replace them with a single [`resource()`](../api/resource.md):

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

Nested paths like `/projects/:projectId/tasks/:taskId` get their own resource. Reserve standalone `new ApiEndpoint()` for non-CRUD operations (search, custom actions, auth).

### Coexisting with Zod or Yup

If the codebase already validates responses with Zod or Yup, choose one approach per type:

- **Entity replaces Zod** (recommended): move the field shape into the Entity class and remove the Zod schema. Entity handles both typing and normalization.
- **Zod in `process()`**: keep strict runtime validation by parsing in [`process()`](../api/RestEndpoint.md#process):

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **Zod only, no Entity**: leave `schema` unset and parse manually. Only do this for endpoints that don't benefit from normalization (auth tokens, one-off responses).

:::warning

Don't define Entity classes and then leave `schema` unset on every endpoint — without `schema`, nothing is normalized and the migration gains little over axios.

:::

### Body typing

Type the body of standalone `POST`/`PUT`/`PATCH` endpoints with `body: {} as BodyType`. Don't use `undefined as unknown as BodyType`: `RestEndpoint` uses the truthiness of [`body`](../api/RestEndpoint.md#body) to decide whether a body argument exists.

```ts
const createUser = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: {} as { name: string; email: string },
  schema: User,
});
```

[`resource()`](../api/resource.md) types its CRUD endpoints automatically.

### Convert call sites to hooks

<Tabs
defaultValue="before"
values={[
{ label: 'Before (axios)', value: 'before' },
{ label: 'After (data-client)', value: 'after' },
]}>
<TabItem value="before">

```tsx
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

Loading and error states move to [`AsyncBoundary`](/docs/api/AsyncBoundary). See [`useSuspense()`](/docs/api/useSuspense) for details.

### Context-based auth

When tokens come from React context (Okta, Auth0) rather than storage, [`hookifyResource()`](../api/hookifyResource.md) injects headers through a hook:

```ts
import { hookifyResource, resource } from '@data-client/rest';
import ApiEndpoint from './ApiEndpoint';
import { Article } from './Article';

export const ArticleResource = hookifyResource(
  resource({
    path: '/articles/:id',
    schema: Article,
    Endpoint: ApiEndpoint,
  }),
  function useInit() {
    const { accessToken } = useAuth();
    return { headers: { Authorization: `Bearer ${accessToken}` } };
  },
);
```

```tsx
const article = useSuspense(ArticleResource.useGet(), { id });
```

See the [authentication guide](./auth.md) for other patterns.

### Gradual migration

If the app uses TanStack Query or SWR and can't convert everything at once, keep the imperative wrappers temporarily but give the endpoints schemas so data is normalized from day one:

```ts
export const getProject = new ApiEndpoint({
  path: '/projects/:id',
  schema: Project,
});

/** Kept for TanStack Query `queryFn` compatibility */
export async function fetchProject(id: string) {
  return getProject({ id });
}
```

Later, replace `useQuery({ queryFn: () => fetchProject(id) })` with `useSuspense(getProject, { id })`.

### Existing endpoint abstractions

Codebases that already have a custom endpoint class wrapping axios (say, one with `path`, `method` and a `toDynamicUrl()` helper) can extend `RestEndpoint` instead of replacing it, keeping backward-compatible methods while gaining [`url()`](../api/RestEndpoint.md#url), [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit), [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) and [`parseResponse()`](../api/RestEndpoint.md#parseResponse):

```ts
import { RestEndpoint } from '@data-client/rest';

export class LegacyEndpoint extends RestEndpoint {
  queryKey: string;

  constructor(params: { path: string; method: string; queryKey: string }) {
    super({
      path: params.path,
      method: params.method,
      urlPrefix: API_ROOT,
    });
    this.queryKey = params.queryKey;
  }

  /** @deprecated use url() */
  toDynamicUrl(segments: Record<string, string>) {
    return this.url(segments);
  }
}
```

## Related guides

- [Authentication](./auth.md) — token and cookie auth patterns
- [Aborting Fetch](./abort.md) — cancellation and debouncing
- [Transforming data on fetch](./network-transform.md) — response transforms, field renaming, file downloads
- [Django Integration](./django.md) — CSRF and cookie auth for Django
