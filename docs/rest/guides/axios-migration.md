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

| Axios | @data-client/rest |
|---|---|
| `baseURL` | [`urlPrefix`](../api/RestEndpoint.md#urlPrefix) |
| `headers` config | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) |
| `interceptors.request` | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) / [`getHeaders()`](../api/RestEndpoint.md#getHeaders) |
| `interceptors.response` | [`parseResponse()`](../api/RestEndpoint.md#parseResponse) / [`process()`](../api/RestEndpoint.md#process) |
| `timeout` | [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) via `signal` |
| `params` / `paramsSerializer` | [`searchParams`](../api/RestEndpoint.md#searchParams) / [`searchToString()`](../api/RestEndpoint.md#searchToString) |
| `cancelToken` / `signal` | `signal` ([AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)) |
| `responseType: 'blob'` | Custom [`parseResponse()`](../api/RestEndpoint.md#parseResponse) — see [file download](./network-transform.md#file-download) |
| `auth: { username, password }` | [`getHeaders()`](../api/RestEndpoint.md#getHeaders) with `btoa()` |
| `transformRequest` | [`getRequestInit()`](../api/RestEndpoint.md#getRequestInit) |
| `transformResponse` | [`process()`](../api/RestEndpoint.md#process) |
| `validateStatus` | Custom [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) |
| `onUploadProgress` | Custom [`fetchResponse()`](../api/RestEndpoint.md#fetchResponse) with [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) |
| `isAxiosError` / `error.response` | [`NetworkError`](../api/RestEndpoint.md#fetchResponse) with `.status` and `.response` |

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

```ts title="Request" column
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

```ts title="Request" column
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

```ts title="Request" column
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

</TabItem>
<TabItem value="after">

The [`useCancelling()`](/docs/api/useCancelling) hook automatically cancels in-flight requests when parameters change:

```tsx
import { useSuspense } from '@data-client/react';
import { useCancelling } from '@data-client/react';

function SearchResults({ query }: { query: string }) {
  const results = useSuspense(
    useCancelling(searchEndpoint),
    { q: query },
  );
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

## Codemod {#codemod}

For non-AI workflows, a standalone [jscodeshift](https://github.com/facebook/jscodeshift) codemod handles the mechanical parts of migration. (The [AI skill](#skill) above runs this automatically as its first step.)

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

The codemod automatically:
- Replaces `import axios from 'axios'` with `import { RestEndpoint } from '@data-client/rest'`
- Converts `axios.create({ baseURL, headers })` into a base `RestEndpoint` class
- Transforms `axios.get()`, `.post()`, `.put()`, `.patch()`, `.delete()` into `RestEndpoint` instances

After running the codemod, you'll need to manually:
- Define [Entity](../api/Entity.md) schemas for your response data
- Convert imperative `api.get()` call sites to declarative [`useSuspense()`](/docs/api/useSuspense) hooks
- Migrate interceptors to lifecycle methods (see examples above)
- Set up [resource()](../api/resource.md) for CRUD endpoints

## Related guides

- [Authentication](./auth.md) — token and cookie auth patterns
- [Aborting Fetch](./abort.md) — cancellation and debouncing
- [Transforming data on fetch](./network-transform.md) — response transforms, field renaming, file downloads
- [Django Integration](./django.md) — CSRF and cookie auth for Django
