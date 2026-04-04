# Got → @data-client/rest Migration

## Detection

- `"got"` in `package.json` dependencies (typically Node.js server-side only)
- `import got from 'got'` in source

Search patterns:
- `import.*from ['"]got['"]` — import statements
- `got\(` or `got\.(get|post|put|patch|delete)` — direct calls

> **Note**: Got is a Node.js-only HTTP library. If migrating a server-rendered app (Next.js API routes, Express handlers), these endpoints may only run server-side.

## Migration Rules

### Basic requests

```ts
// Before: got
import got from 'got';
const users = await got('https://api.example.com/users', {
  headers: { Authorization: `Bearer ${token}` },
  searchParams: { page: 1 },
}).json<User[]>();

// After: RestEndpoint
import { RestEndpoint } from '@data-client/rest';
import { User } from './User';

export const getUsers = new RestEndpoint({
  path: '/users',
  searchParams: {} as { page?: number },
  schema: [User],
});
```

### Key conversions

| Got pattern | RestEndpoint equivalent |
|-------------|----------------------|
| `prefixUrl` | `urlPrefix` |
| `headers` option | `getHeaders()` |
| `searchParams` | `searchParams` type (same concept, different runtime) |
| `hooks.beforeRequest` | `getHeaders()` or `getRequestInit()` |
| `hooks.afterResponse` | `process()` |
| `hooks.beforeError` | `fetchResponse()` override |
| `.json<T>()` | Automatic — RestEndpoint parses JSON by default |
| `retry` | Not built in; use error-policy for retry behavior |
| `timeout` | `signal: AbortSignal.timeout(ms)` |
| `responseType: 'json'` | Default behavior |
| `responseType: 'buffer'` | `parseResponse()` override with `response.arrayBuffer()` |

### Got instance → base class

```ts
// Before: got instance with shared config
import got from 'got';

const api = got.extend({
  prefixUrl: 'https://api.example.com',
  headers: { Authorization: `Bearer ${token}` },
  hooks: {
    beforeRequest: [
      options => {
        options.headers['X-Request-Id'] = generateId();
      },
    ],
    afterResponse: [
      (response) => {
        logResponse(response.statusCode);
        return response;
      },
    ],
  },
});

const users = await api('users').json<User[]>();

// After: base class
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
      'X-Request-Id': generateId(),
    };
  }

  async parseResponse(response: Response) {
    const result = await super.parseResponse(response);
    logResponse(response.status);
    return result;
  }
}
```

### Error handling

```ts
// Before
import { HTTPError } from 'got';
try { ... } catch (err) {
  if (err instanceof HTTPError) {
    console.log(err.response.statusCode);
    console.log(err.response.body);
  }
}

// After
import { NetworkError } from '@data-client/rest';
try { ... } catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);
    const body = await err.response.json();
  }
}
```

### Pagination

```ts
// Before: got pagination
import got from 'got';
const allUsers = await got.paginate.all('https://api.example.com/users', {
  pagination: {
    transform: (response) => JSON.parse(response.body),
    paginate: ({ currentItems, response }) => {
      const next = response.headers.link?.match(/<([^>]+)>; rel="next"/)?.[1];
      return next ? { url: new URL(next) } : false;
    },
  },
});

// After: use paginationField or getPage
const UserResource = resource({
  path: '/users',
  schema: User,
  paginationField: 'cursor',
});
// ctrl.fetch(UserResource.getList.getPage, { cursor: nextCursor })
```

## Reference

- [RestEndpoint API](https://dataclient.io/rest/api/RestEndpoint) — lifecycle methods reference
- [NetworkError](https://dataclient.io/rest/api/NetworkError) — error class
- [Pagination guide](https://dataclient.io/rest/guides/pagination) — cursor/offset pagination patterns
