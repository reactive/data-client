---
name: axios-to-rest-migration
description: Migrate from axios to @data-client/rest. Use when removing axios dependency, converting axios.create/interceptors/error handling to RestEndpoint patterns, or when seeing axios imports in a project that uses @data-client/rest.
---

# Axios → @data-client/rest Migration

## Step 1: Run the codemod

The codemod handles deterministic transforms automatically:

```bash
npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/
```

**What the codemod does:**
- `import axios from 'axios'` → `import { RestEndpoint } from '@data-client/rest'`
- `axios.create({ baseURL, headers })` → `RestEndpoint` subclass with `urlPrefix` + `getHeaders()`
- `axios.get(url)` / `.post(url)` / `.put(url)` / `.patch(url)` / `.delete(url)` → `new RestEndpoint({ path, method })`

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

`NetworkError` has `.status` (number) and `.response` (fetch `Response`). To read the body, use `await err.response.json()` or `.text()`.

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

## Step 3: Define schemas and convert call sites

After mechanical transforms, define Entity schemas for your data and convert imperative API calls to declarative hooks:

```ts
// 1. Define an Entity for each resource type
class User extends Entity {
  id = '';
  name = '';
  email = '';
  static key = 'User';
}

// 2. Create a resource (generates CRUD endpoints)
const UserResource = resource({
  path: '/users/:id',
  schema: User,
});

// 3. Replace imperative calls with hooks
// Before: const { data } = await api.get('/users/1');
// After:
const user = useSuspense(UserResource.get, { id: '1' });
```

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
- [NetworkError](https://dataclient.io/rest/api/NetworkError) — error class
- [Authentication guide](https://dataclient.io/rest/guides/auth) — token and cookie patterns
- [Abort guide](https://dataclient.io/rest/guides/abort) — cancellation patterns
