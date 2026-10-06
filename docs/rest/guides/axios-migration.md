---
title: Migrating from Axios to Reactive Data Client
sidebar_label: Axios Migration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';
import SkillTabs from '@site/src/components/SkillTabs';
import SiteOnly from '@site/src/components/SiteOnly';

# Migrating from Axios

[`@data-client/rest`](/rest) replaces axios with a declarative, type-safe approach to REST APIs.

<SiteOnly>

## AI-assisted migration {#skill}

Install the REST setup skill to automate the migration with your AI coding assistant. It auto-detects axios in your project and runs the [codemod](#codemod) for deterministic transforms, then guides you through the manual steps that require judgment (interceptors, error handling, schema definitions, etc.).

<SkillTabs repo="reactive/data-client" skills={['data-client-schema', 'data-client-rest-setup', 'data-client-rest']} />

Then run skill `/data-client-rest-setup` to start the migration. It will detect axios and apply the appropriate migration sub-procedure automatically.

</SiteOnly>

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

Response interceptors that transform the body, such as converting `snake_case` keys, belong in [`process()`](../api/RestEndpoint.md#process). See [snakes to camels](./network-transform.md#snakes-to-camels) for a complete example.

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

[`NetworkError`](../api/RestEndpoint.md#fetchResponse) provides `.status` and `.response` (the raw [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object). For soft retries on server errors, see [`errorPolicy`](../api/RestEndpoint.md#errorpolicy).

</TabItem>
</Tabs>

#### Server error messages

Axios codebases commonly surface `error.response.data.error` or `.message` to the user. Read it from the `Response` body instead, once, in the base class's [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse), so call sites get it from `error.message` without parsing the body:

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
import { searchEndpoint } from './api/search';
import ResultsList from './ResultsList';

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

Set [`content`](../api/RestEndpoint.md#content) to `'blob'`, `'arrayBuffer'` or `'text'`. See [file download](./network-transform.md#file-download) for the full endpoint and triggering a browser download.

### Query serialization

```ts title="Before (axios)"
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params =>
    qs.stringify(params, { arrayFormat: 'repeat' }),
});
```

Override [`searchToString()`](../api/RestEndpoint.md#searchToString) to serialize with `qs`; see [using the `qs` library](../api/RestEndpoint.md#searchToString).

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

Read the cookie in [`getHeaders()`](../api/RestEndpoint.md#getHeaders) for non-`GET` requests. See [Django Integration](./django.md) for the complete endpoint class.

### Upload progress

`fetch` cannot report upload progress, so use [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) inside [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse). The `onProgress` field is passed as an endpoint option, like any other member.

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

A standalone [jscodeshift](https://github.com/facebook/jscodeshift) codemod handles the mechanical parts of migration.<SiteOnly> Run it yourself for non-AI workflows; the [AI skill](#skill) above runs it automatically as its first step.</SiteOnly>

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
- The rest of the [quick reference](#quick-reference) — see the [migration examples](#migration-examples) above
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

- **Zod in `process()`** (recommended): keep runtime validation by parsing in [`process()`](../api/RestEndpoint.md#process), and let the Entity handle normalization:

  ```ts
  const getUser = new ApiEndpoint({
    path: '/users/:id',
    schema: User,
    process(value: any) {
      return userSchema.parse(value);
    },
  });
  ```

- **Entity replaces Zod**: move the field shape into the Entity class and remove the Zod schema. Entity fields provide types, not runtime checks, so add [`static validate()`](../api/Entity.md#validate) for any fields the server might send malformed.
- **Zod only, no Entity**: leave `schema` unset and parse manually. Only do this for endpoints that don't benefit from normalization (auth tokens, one-off responses).

:::warning

Don't define Entity classes and then leave `schema` unset on every endpoint — without `schema`, nothing is normalized and the migration gains little over axios.

:::

### Body typing

Type the body of standalone `POST`/`PUT`/`PATCH` endpoints with `body: {} as BodyType`. Don't use `undefined as unknown as BodyType`: `RestEndpoint` treats [`body`](../api/RestEndpoint.md#body)`: undefined` as having no body argument.

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

Loading and error states move to [`AsyncBoundary`](/docs/api/AsyncBoundary). See [`useSuspense()`](/docs/api/useSuspense) for details.

### Context-based auth

When tokens come from React context (Okta, Auth0) rather than storage, use [`hookifyResource()`](../api/hookifyResource.md) to inject headers through a hook. See the [authentication guide](./auth.md) for this and other patterns.

### Gradual migration

If the app uses TanStack Query or SWR and can't convert everything at once, keep those hooks temporarily but fetch through [`controller.fetch()`](/docs/api/Controller#fetch). Calling an endpoint directly only runs its fetch; going through the Controller also normalizes the response into the shared cache, so data is consistent from day one:

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

Later, replace `useProject(id)` with `useSuspense(getProject, { id })`.

### Existing endpoint abstractions

Codebases that already have a custom endpoint class wrapping axios (say, one with `path`, `method` and a `toDynamicUrl()` helper) can extend `RestEndpoint` instead of replacing it, keeping backward-compatible methods while gaining [`url()`](../api/RestEndpoint.md#url), [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit), [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) and [`parseResponse()`](../api/RestEndpoint.md#parseResponse):

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

Pass extra members like `queryKey` as options rather than through a custom constructor, so [`extend()`](../api/RestEndpoint.md#extend) (used by `resource()`, `hookifyResource()` and `useCancelling()`) keeps working.

## Related guides

- [Authentication](./auth.md) — token and cookie auth patterns
- [Aborting Fetch](./abort.md) — cancellation and debouncing
- [Transforming data on fetch](./network-transform.md) — response transforms, field renaming, file downloads
- [Django Integration](./django.md) — CSRF and cookie auth for Django
