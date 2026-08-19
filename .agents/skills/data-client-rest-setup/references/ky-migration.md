# Ky → @data-client/rest Migration

## Detection

- `"ky"` in `package.json` dependencies
- `import ky from 'ky'` or `import ky from 'ky/umd'` in source

Search patterns:
- `import.*from ['"]ky['"]` — import statements
- `ky\.create` — instance creation
- `ky\.(get|post|put|patch|delete|head)` — direct calls

## Migration Rules

### Basic instance → base class

```ts
// Before: ky instance
import ky from 'ky';
const api = ky.create({
  prefixUrl: 'https://api.example.com',
  headers: { Authorization: `Bearer ${token}` },
  hooks: {
    beforeRequest: [req => { /* ... */ }],
    afterResponse: [(_req, _opts, res) => { /* ... */ }],
  },
});
const users = await api.get('users').json<User[]>();

// After: RestEndpoint base class
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
}

export const getUsers = new ApiEndpoint({
  path: '/users',
  schema: [User],
});
```

### Key conversions

| Ky pattern | RestEndpoint equivalent |
|------------|----------------------|
| `prefixUrl` | `urlPrefix` |
| `headers` option | `getHeaders()` |
| `hooks.beforeRequest` | `getHeaders()` or `getRequestInit()` |
| `hooks.afterResponse` | `process()` or `parseResponse()` |
| `hooks.beforeError` | `fetchResponse()` override |
| `ky.create()` shared options | Base class overrides |
| `.json<T>()` | Automatic — RestEndpoint parses JSON by default |
| `HTTPError` | `NetworkError` |
| `searchParams` option | `searchParams` type on endpoint |
| `timeout` | `signal: AbortSignal.timeout(ms)` |
| `retry` | Use error-policy for retry behavior |
| `credentials` | `getRequestInit()` override |

### Hooks → lifecycle methods

```ts
// Before: ky hooks
const api = ky.create({
  hooks: {
    beforeRequest: [
      request => {
        request.headers.set('X-Request-Id', generateId());
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        logResponse(response.status);
        return response;
      },
    ],
    beforeError: [
      error => {
        reportError(error);
        return error;
      },
    ],
  },
});

// After: lifecycle methods
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'X-Request-Id': generateId(),
    };
  }

  async parseResponse(response: Response) {
    logResponse(response.status);
    return super.parseResponse(response);
  }

  async fetchResponse(input: RequestInfo, init: RequestInit) {
    try {
      return await super.fetchResponse(input, init);
    } catch (error) {
      reportError(error);
      throw error;
    }
  }
}
```

### Error handling

```ts
// Before
import { HTTPError } from 'ky';
try { ... } catch (err) {
  if (err instanceof HTTPError) {
    const body = await err.response.json();
    console.log(err.response.status, body);
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

## Reference

- [RestEndpoint API](https://dataclient.io/rest/api/RestEndpoint) — lifecycle methods reference
- [NetworkError](https://dataclient.io/rest/api/NetworkError) — error class
