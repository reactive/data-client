# SuperAgent → @data-client/rest Migration

## Detection

- `"superagent"` in `package.json` dependencies
- `import request from 'superagent'` or `require('superagent')` in source

Search patterns:
- `import.*from ['"]superagent['"]` — import statements
- `require\(['"]superagent['"]\)` — CommonJS require
- `\.(get|post|put|patch|del|delete)\(` — chained method calls (context: superagent import)

## Migration Rules

### Basic requests

```ts
// Before: superagent
import request from 'superagent';
const res = await request
  .get('https://api.example.com/users')
  .set('Authorization', `Bearer ${token}`)
  .query({ page: 1 });
const users = res.body;

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

| SuperAgent pattern | RestEndpoint equivalent |
|-------------------|----------------------|
| `.set(name, value)` headers | `getHeaders()` |
| `.query(params)` | `searchParams` type |
| `.send(body)` | `body` type on endpoint |
| `.use(plugin)` | Lifecycle method overrides |
| Chained `.get()/.post()` etc. | `method` option |
| `.type('json')` / `.accept('json')` | Automatic — JSON is default |
| `.withCredentials()` | `getRequestInit()` with `credentials: 'include'` |
| `.timeout({ response, deadline })` | `signal: AbortSignal.timeout(ms)` |
| `.retry(count)` | Use error-policy for retry behavior |
| `res.body` | Automatic — RestEndpoint returns parsed JSON |
| `res.status` | Available on `NetworkError.status` for error cases |

### Shared config via agent/plugin → base class

```ts
// Before: superagent with shared config
import request from 'superagent';
import prefix from 'superagent-prefix';

const api = request.agent()
  .use(prefix('https://api.example.com'))
  .set('Authorization', `Bearer ${getToken()}`);

const res = await api.get('/users').query({ role: 'admin' });

// After: base class
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Bearer ${getToken()}`,
    };
  }
}

export const getUsers = new ApiEndpoint({
  path: '/users',
  searchParams: {} as { role?: string },
  schema: [User],
});
```

### POST / mutation patterns

```ts
// Before
const res = await request
  .post('https://api.example.com/users')
  .send({ name: 'Alice', email: 'alice@example.com' });

// After
export const createUser = new RestEndpoint({
  path: '/users',
  method: 'POST',
  schema: User,
});
```

### Error handling

```ts
// Before
try {
  const res = await request.get('/api/users');
} catch (err) {
  if (err.status) {
    console.log(err.status, err.response.body);
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

### File uploads

```ts
// Before
await request
  .post('/upload')
  .attach('file', blob, 'photo.jpg')
  .field('description', 'My photo');

// After — use FormData with RestEndpoint
const uploadFile = new RestEndpoint({
  path: '/upload',
  method: 'POST',
  body: {} as FormData,
  schema: undefined,
});
// Usage: ctrl.fetch(uploadFile, formData)
```

## Reference

- [RestEndpoint API](https://dataclient.io/rest/api/RestEndpoint) — lifecycle methods reference
- [NetworkError](https://dataclient.io/rest/api/NetworkError) — error class
