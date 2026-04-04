# Raw fetch → @data-client/rest Migration

## Detection

Look for direct `fetch()` calls or thin wrappers around fetch in the codebase:

- `fetch(` calls with REST-style URLs (`/api/`, `/users/`, etc.)
- Custom wrapper functions that call `fetch` internally
- No HTTP client library in `package.json`

Search patterns:
- `\bfetch\(` — direct fetch calls
- `new Request\(` — Request object construction
- `\.json\(\)` — response parsing (common in fetch wrappers)

## Migration Rules

Convert `fetch()` call sites to `RestEndpoint`:

```ts
// Before: raw fetch wrapper
async function getUsers(token: string): Promise<User[]> {
  const res = await fetch('https://api.example.com/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// After: RestEndpoint (auth moves to base class)
import { RestEndpoint } from '@data-client/rest';
import { User } from './User';

export const getUsers = new RestEndpoint({
  path: '/users',
  schema: [User],
});
```

### Key conversions

| fetch pattern | RestEndpoint equivalent |
|---------------|----------------------|
| `headers` option | `getHeaders()` on base class |
| `res.ok` / status checks | Automatic — throws `NetworkError` on non-2xx |
| `res.json()` | Automatic — `parseResponse()` defaults to JSON |
| Base URL string concatenation | `urlPrefix` on base class |
| Query string building (`URLSearchParams`, template literals) | `searchParams` type + `searchToString()` override |
| `method: 'POST'` | `method` option on RestEndpoint |
| `body: JSON.stringify(data)` | Pass object directly — RestEndpoint serializes automatically |
| `credentials: 'include'` | `getRequestInit()` override on base class |
| `AbortController` / `signal` | `signal` option on RestEndpoint |

### Fetch wrappers with shared config

```ts
// Before: custom fetch wrapper
function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options?.headers,
    },
  });
}
const res = await apiFetch('/users');
const users = await res.json();

// After: base class captures shared config
class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = BASE_URL;

  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      Authorization: `Bearer ${getToken()}`,
    };
  }
}

export const getUsers = new ApiEndpoint({
  path: '/users',
  schema: [User],
});
```

### POST / mutation patterns

```ts
// Before
async function createUser(data: UserInput): Promise<User> {
  const res = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

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
if (!res.ok) {
  const body = await res.json();
  throw new Error(body.message);
}

// After — RestEndpoint throws NetworkError on non-2xx
import { NetworkError } from '@data-client/rest';
try { ... } catch (err) {
  if (err instanceof NetworkError) {
    console.log(err.status);         // HTTP status code
    const body = await err.response.json();
    console.log(body.message);
  }
}
```

## Reference

- [RestEndpoint API](https://dataclient.io/rest/api/RestEndpoint) — lifecycle methods reference
- [NetworkError](https://dataclient.io/rest/api/NetworkError) — error class
- [Authentication guide](https://dataclient.io/rest/guides/auth) — token and cookie patterns
