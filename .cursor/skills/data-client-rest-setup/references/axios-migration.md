# Axios → @data-client/rest Migration

## Step 1: Run the codemod

**Always run this first**, before any manual edits. It handles deterministic transforms that save significant manual work:

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

**What the codemod does:**
- `import axios from 'axios'` → `import { RestEndpoint } from '@data-client/rest'`
- `axios.create({ baseURL, headers })` → `RestEndpoint` subclass with `urlPrefix` + `getHeaders()`
- `axios.get(url)` / `.post(url)` / `.put(url)` / `.patch(url)` / `.delete(url)` → `new RestEndpoint({ path, method })`
- Instance method calls (e.g. `api.post(url)` where `api = axios.create(...)`) → `new CreatedClassName({ path, method })`

**When the codemod has limited value** (skip to Step 2):
- The project wraps axios in a custom class/function and never calls `axios.get()`/`.post()` directly
- Axios is called only via `axios(config)` (generic invocation without a method name)

**What the codemod does NOT do** (requires manual migration — see rules below):
- Interceptors
- Error handling (`isAxiosError`, `error.response`)
- `timeout`, `cancelToken`, `responseType`
- `paramsSerializer`, `auth`, `validateStatus`
- `onUploadProgress` / `onDownloadProgress`
- Entity/schema definitions (new concept)
- Converting imperative call sites to declarative hooks

## Step 2: Manual migration rules

### Interceptors → lifecycle methods

Request interceptors map to `getHeaders()` or `getRequestInit()`. Response interceptors map to `parseResponse()` or `process()`.

```ts
// Before: request interceptor
api.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

// After: getHeaders() override
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Bearer ${getToken()}`,
    };
  }
}
```

```ts
// Before: response interceptor (unwrap data)
api.interceptors.response.use(response => response.data);

// After: not needed — RestEndpoint already returns parsed JSON body
```

```ts
// Before: response interceptor (transform)
api.interceptors.response.use(response => {
  response.data = camelizeKeys(response.data);
  return response;
});

// After: process() override
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  process(value: any, ...args: any) {
    return camelizeKeys(value);
  }
}
```

### Error handling

```ts
// Before
import axios from 'axios';
try { ... } catch (err) {
  if (axios.isAxiosError(err)) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}

// After
import { NetworkError } from '@data-client/rest';
try { ... } catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);        // HTTP status code
    console.log(err.response);      // raw Response object
  }
}
```

`NetworkError` has `.status` (number) and `.response` (fetch `Response`). To read the body, use `await err.response.clone().json()` or `.text()`. Always `.clone()` before reading — the body can only be consumed once.

**Common pattern: extracting server error messages.** Many axios codebases use `error.response.data.error` or `error.response.data.message` for user-facing error strings. Map this to:

```ts
// Before (very common axios pattern)
if (isAxiosError(error) && error.response) {
  throw new Error(error.response.data.error);
}

// After — read the error body from the Response
if (error instanceof NetworkError) {
  const body = await error.response.clone().json();
  throw new Error(body.error ?? error.response.statusText);
}
```

If this pattern is repeated across many functions, centralize it in the base class `fetchResponse()` so individual call sites don't need try/catch:

```ts
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  async fetchResponse(input: RequestInfo, init: RequestInit) {
    try {
      return await super.fetchResponse(input, init);
    } catch (error) {
      if (error instanceof NetworkError) {
        const body = await error.response.clone().json().catch(() => null);
        if (body?.error) throw new Error(body.error);
        if (body?.message) throw new Error(body.message);
      }
      throw error;
    }
  }
}
```

### timeout → AbortSignal.timeout()

```ts
// Before
axios.get('/users', { timeout: 5000 });

// After
const getUsers = new RestEndpoint({
  path: '/users',
  signal: AbortSignal.timeout(5000),
});
```

### cancelToken → AbortController

```ts
// Before
const source = axios.CancelToken.source();
axios.get('/users', { cancelToken: source.token });
source.cancel();

// After
const controller = new AbortController();
const getUsers = new RestEndpoint({
  path: '/users',
  signal: controller.signal,
});
controller.abort();
```

In React, use `useCancelling()` for automatic cancellation on param changes.

### responseType: 'blob' / 'arraybuffer' → parseResponse()

```ts
// Before
axios.get('/files/1', { responseType: 'blob' });

// After
const downloadFile = new RestEndpoint({
  path: '/files/:id',
  schema: undefined,
  dataExpiryLength: 0,
  async parseResponse(response: Response) {
    return await response.blob();
  },
  process(value): Blob {
    return value;
  },
});
```

### paramsSerializer → searchToString()

```ts
// Before
axios.get('/users', {
  params: { ids: [1, 2, 3] },
  paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
});

// After
const getUsers = new RestEndpoint({
  path: '/users',
  searchToString(searchParams: Record<string, any>) {
    return qs.stringify(searchParams, { arrayFormat: 'repeat' });
  },
});
```

### auth: { username, password } → getHeaders()

```ts
// Before
axios.get('/api', { auth: { username: 'user', password: 'pass' } });

// After
class BasicAuthEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Basic ${btoa('user:pass')}`,
    };
  }
}
```

### validateStatus → fetchResponse()

```ts
// Before
axios.get('/api', { validateStatus: status => status < 500 });

// After
class LenientEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  fetchResponse(input: RequestInfo, init: RequestInit) {
    return fetch(input, init).then(response => {
      if (response.status >= 500) {
        throw new NetworkError(response);
      }
      return response;
    });
  }
}
```

### xsrfCookieName / xsrfHeaderName → getHeaders()

```ts
// Before
axios.create({
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// After
class CsrfEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
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

See also the [Django Integration guide](https://dataclient.io/rest/guides/django).

### onUploadProgress → custom fetchResponse()

```ts
// Before
axios.post('/upload', formData, {
  onUploadProgress: e => console.log(e.loaded / e.total),
});

// After — use XMLHttpRequest inside fetchResponse
class UploadEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  declare onProgress?: (progress: number) => void;

  fetchResponse(input: RequestInfo, init: RequestInit) {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(init.method || 'POST', typeof input === 'string' ? input : input.url);
      if (init.headers) {
        Object.entries(init.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v as string));
      }
      if (this.onProgress) {
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) this.onProgress!(e.loaded / e.total);
        };
      }
      xhr.onload = () => resolve(new Response(xhr.response, { status: xhr.status, statusText: xhr.statusText }));
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.send(init.body);
    });
  }
}
```

## Step 3: Define schemas and wire to endpoints

After mechanical transforms, define Entity schemas and wire them to endpoints. This enables normalization and caching — the core value of @data-client.

### Non-standard primary keys

Many APIs (MongoDB, etc.) use `_id` instead of `id`. Override `pk()`:

```ts
class User extends Entity {
  _id = '';
  name = '';
  email = '';
  static key = 'User';
  pk() { return this._id; }
}
```

### Use `resource()` for CRUD groups

When an API module has standard CRUD operations on a single path (list, get, create, update, delete), use `resource()` instead of defining each endpoint individually:

```ts
// Before (axios): separate functions for getUsers, getUser, createUser, updateUser, deleteUser
// After: one resource generates all CRUD endpoints
const UserResource = resource({
  path: '/users/:id',
  schema: User,
  Endpoint: BaseEndpoint,
});
// UserResource.getList, .get, .create, .update, .delete are all available
```

Use standalone `new BaseEndpoint()` only for non-CRUD operations (search, custom actions, auth endpoints).

### Nested resources

For nested paths like `/projects/:projectId/tasks/:taskId`, create separate resources:

```ts
const TaskResource = resource({
  path: '/projects/:projectId/tasks/:taskId',
  schema: Task,
  Endpoint: BaseEndpoint,
});
```

### Coexisting with Zod/Yup validation

If the codebase already uses Zod or Yup for response validation, choose one approach:

- **Option A — Entity replaces Zod** (recommended): Move field shapes to Entity classes, remove Zod schemas for those types. Entity handles both typing and normalization.
- **Option B — Zod in `process()`**: Keep Zod for strict runtime validation by parsing in `process()`:
  ```ts
  const getUser = new BaseEndpoint({
    path: '/users/:id',
    schema: User,
    process(value, ...args) {
      return userSchema.parse(super.process(value, ...args));
    },
  });
  ```
- **Option C — Zod only, no Entity**: Set `schema: undefined` and parse responses manually. Use this only for endpoints that don't benefit from normalization/caching (auth tokens, one-off responses).

Do NOT create Entity classes and then leave `schema: undefined` on all endpoints — that wastes the migration effort.

### Body typing for POST/PUT/PATCH

When defining standalone endpoints with a body, use `body: {} as BodyType` (truthy placeholder). Do **not** use `undefined as unknown as BodyType` — RestEndpoint uses the truthiness of `body` to determine whether to send a request body.

```ts
const createUser = new BaseEndpoint({
  path: '/users',
  method: 'POST' as const,
  body: {} as { name: string; email: string },
  schema: User,
});
```

`resource()` handles this automatically for its CRUD endpoints.

### Convert call sites to hooks

```ts
// Before: const { data } = await api.get('/users/1');
// After:
const user = useSuspense(UserResource.get, { id: '1' });
```

### Context-based auth (Okta, Auth0)

When auth tokens come from React context rather than localStorage, use [`hookifyResource()`](hookifyResource.md) to inject headers via a hook:

```ts
export const ArticleResource = hookifyResource(
  resource({ path: '/articles/:id', schema: Article, Endpoint: BaseEndpoint }),
  function useInit() {
    const { accessToken } = useAuth();
    return { headers: { Authorization: `Bearer ${accessToken}` } };
  },
);
// Usage: useSuspense(ArticleResource.useGet(), { id })
```

### Gradual migration with TanStack Query

If the app uses TanStack Query / SWR and you can't convert everything at once, keep imperative wrapper functions temporarily but wire Entity schemas into the endpoints so data is normalized:

```ts
const getProjectEndpoint = new BaseEndpoint({
  path: '/projects/:id',
  schema: Project,
});

// Wrapper preserved for TanStack Query compatibility
export async function getProject(id: string) {
  return getProjectEndpoint({ id });
}
```

Later, replace `useQuery({ queryFn: getProject })` with `useSuspense(getProjectEndpoint, { id })`.

### Existing endpoint abstractions

Enterprise codebases often have a custom endpoint class wrapping axios (e.g. `ApiEndpoint` with `path`, `method`, `toDynamicUrl()`). Instead of replacing it, **extend `RestEndpoint`** and keep backward-compatible methods:

```ts
class MyEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  queryKey: string;
  constructor(params: { path: string; method: string; queryKey: string }) {
    super({ path: params.path, method: params.method, schema: undefined, urlPrefix: API_ROOT });
    this.queryKey = params.queryKey;
  }
  // Legacy helper — prefer url() directly
  toDynamicUrl(segments: Record<string, string>) {
    return this.url(segments);
  }
}
```

This lets existing hooks and endpoint definitions keep working while gaining `RestEndpoint` lifecycle methods (`url()`, `getRequestInit()`, `fetchResponse()`, `parseResponse()`).

## Where to find axios patterns

Search patterns for locating axios usage in a codebase:

- `import.*from ['"]axios['"]` — import statements
- `axios\.create` — instance creation
- `axios\.(get|post|put|patch|delete)` — direct calls
- `\.interceptors\.(request|response)\.use` — interceptors
- `isAxiosError` — error handling
- `cancelToken|CancelToken` — cancellation (deprecated)
- `onUploadProgress|onDownloadProgress` — progress callbacks

## Reference

- [Axios Migration Guide](https://dataclient.io/rest/guides/axios-migration) — full documentation with interactive examples
- [RestEndpoint API](https://dataclient.io/rest/api/RestEndpoint) — lifecycle methods reference
- [hookifyResource](https://dataclient.io/rest/api/hookifyResource) — context-based auth via hooks
- [NetworkError](https://dataclient.io/rest/api/NetworkError) — error class
- [Authentication guide](https://dataclient.io/rest/guides/auth) — token and cookie patterns
- [Abort guide](https://dataclient.io/rest/guides/abort) — cancellation patterns
