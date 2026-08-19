---
name: data-client-rest-setup
description: Set up and migrate to @data-client/rest for REST APIs. Detects existing HTTP patterns (axios, fetch, ky, superagent, got) and migrates them. Creates custom RestEndpoint base class with common behaviors. Use when adopting @data-client/rest in a new or existing project.
disable-model-invocation: true
---

# REST Protocol Setup & Migration

This skill configures `@data-client/rest` for a project. It handles both fresh setup and migration from existing HTTP libraries. It should be applied after skill "data-client-setup" detects REST API patterns.

**First, apply the skill "data-client-rest"** for accurate implementation patterns.

## Step 1: Installation

Install the REST package alongside the core package:

```bash
# npm
npm install @data-client/rest

# yarn
yarn add @data-client/rest

# pnpm
pnpm add @data-client/rest
```

## Step 2: Detect Existing HTTP Patterns

Scan the codebase to determine what's currently used. **Multiple patterns may coexist** — run each applicable migration sub-procedure independently on the relevant files.

### Detection Checklist

Check `package.json` dependencies and scan source files:

| Check | Pattern | Action |
|-------|---------|--------|
| `"axios"` in dependencies, or `import.*from ['"]axios['"]` in source | **Axios** | Follow [references/axios-migration.md](references/axios-migration.md) |
| `fetch(` calls with REST-style URLs, or wrapper functions around `fetch` | **Raw fetch** | Follow [references/fetch-migration.md](references/fetch-migration.md) |
| `"ky"` in dependencies, or `import.*from ['"]ky['"]` | **Ky** | Follow [references/ky-migration.md](references/ky-migration.md) |
| `"superagent"` in dependencies | **SuperAgent** | Follow [references/superagent-migration.md](references/superagent-migration.md) |
| `"got"` in dependencies (rare in browser code) | **Got** | Follow [references/got-migration.md](references/got-migration.md) |
| No existing HTTP library detected | **Fresh project** | Skip to [Step 3: Custom RestEndpoint Base Class](#step-3-custom-restendpoint-base-class) |

### Ambiguous Detection

If you cannot confidently determine which patterns are used (e.g., no clear imports but HTTP calls exist), **ask the user**:

> I found HTTP calls in your codebase but couldn't determine the library. Are you migrating from:
> 1. axios
> 2. Raw fetch / custom fetch wrapper
> 3. ky
> 4. superagent
> 5. Something else (please describe)
> 6. Starting fresh (no migration needed)

### Mixed Codebases

When multiple HTTP libraries are detected, run each sub-procedure on the relevant files. The sub-procedures are independent and don't conflict:

1. Identify which files use which library (group by import statements)
2. Run each applicable migration sub-procedure on its file group
3. After all migrations, proceed to the base class setup

## Migration References

Each migration is a self-contained reference. Read only the relevant one(s) based on detection results above. After completing migrations, return here for base class setup.

- **Axios** → [references/axios-migration.md](references/axios-migration.md) — codemod, interceptors, error handling, timeout, cancelToken, responseType, paramsSerializer, auth, validateStatus, CSRF, upload progress
- **Raw fetch** → [references/fetch-migration.md](references/fetch-migration.md) — fetch wrappers, headers, status checks, POST patterns, error handling
- **Ky** → [references/ky-migration.md](references/ky-migration.md) — prefixUrl, hooks, HTTPError, instance config
- **SuperAgent** → [references/superagent-migration.md](references/superagent-migration.md) — chained API, plugins, agents, file uploads
- **Got** → [references/got-migration.md](references/got-migration.md) — Node.js patterns, hooks, pagination, retry

## Step 3: Custom RestEndpoint Base Class

After installation and any migrations, **offer to create a custom RestEndpoint class** for the project.

### Detection Checklist

Scan the existing codebase for common REST patterns to include:

1. **Base URL / API prefix**: Look for hardcoded URLs like `https://api.example.com` or env vars like `process.env.API_URL`
2. **Authentication**: Look for `Authorization` headers, tokens in localStorage/cookies, auth interceptors
3. **Content-Type handling**: Check if API uses JSON, form-data, or custom content types
4. **Error handling**: Look for error response patterns, status code handling
5. **Request/Response transforms**: Data transformations, date parsing, case conversion
6. **Query string format**: Simple params vs nested objects (may need qs library)

### Base Class Template

Create a file at `src/api/BaseEndpoint.ts` (or similar location based on project structure):

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

/**
 * Base RestEndpoint with project-specific defaults.
 * Extend this for all REST API endpoints.
 */
export class BaseEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  // API base URL - adjust based on detected patterns
  urlPrefix = process.env.REACT_APP_API_URL ?? 'https://api.example.com';

  // Add authentication headers
  getHeaders(headers: HeadersInit): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }
}
```

## Common Lifecycle Overrides

Include these based on what's detected in the codebase. See [RestEndpoint](references/RestEndpoint.md) for full API documentation.

### Authentication (async token refresh)

```ts
async getHeaders(headers: HeadersInit): Promise<HeadersInit> {
  const token = await getValidToken(); // handles refresh
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}
```

### Authentication from React context (Okta, Auth0)

When auth tokens live in React context (not localStorage), `getHeaders()` on a base class **cannot** access them. Use [`hookifyResource()`](references/hookifyResource.md) to inject context-derived headers into every endpoint:

```ts
import { hookifyResource, resource } from '@data-client/rest';

const ArticleResourceBase = resource({
  path: '/articles/:id',
  schema: Article,
  Endpoint: BaseEndpoint,
});

export const ArticleResource = hookifyResource(
  ArticleResourceBase,
  function useInit() {
    const accessToken = useContext(AuthContext);
    return {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
  },
);
```

Usage: `useSuspense(ArticleResource.useGet(), { id })` — the hook calls `useInit()` on every render, so the token is always fresh from context.

### Custom Request Init (CSRF, credentials)

```ts
getRequestInit(body?: RequestInit['body'] | Record<string, unknown>): RequestInit {
  return {
    ...super.getRequestInit(body),
    credentials: 'include', // for cookies
    headers: {
      'X-CSRF-Token': getCsrfToken(),
    },
  };
}
```

### Custom Response Parsing (unwrap data envelope)

```ts
process(value: any, ...args: any[]) {
  // If API wraps responses in { data: ... }
  return value.data ?? value;
}
```

### Custom Error Handling

```ts
async fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response> {
  const response = await super.fetchResponse(input, init);
  
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
  
  return response;
}
```

### Custom Search Params (using qs library)

```ts
searchToString(searchParams: Record<string, any>): string {
  return qs.stringify(searchParams, { arrayFormat: 'brackets' });
}
```

### Custom parseResponse (handle non-JSON)

```ts
async parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('text/csv')) {
    return parseCSV(await response.text());
  }
  
  return super.parseResponse(response);
}
```

## Full Example with Multiple Overrides

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

export class BaseEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = process.env.API_URL ?? 'http://localhost:3001/api';

  async getHeaders(headers: HeadersInit): Promise<HeadersInit> {
    const token = await getAuthToken();
    return {
      ...headers,
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  getRequestInit(body?: RequestInit['body'] | Record<string, unknown>): RequestInit {
    return {
      ...super.getRequestInit(body),
      credentials: 'include',
    };
  }

  searchToString(searchParams: Record<string, any>): string {
    return qs.stringify(searchParams, { arrayFormat: 'brackets' });
  }

  process(value: any, ...args: any[]) {
    return value?.data ?? value;
  }
}

async function getAuthToken(): Promise<string | null> {
  return localStorage.getItem('token');
}
```

## Usage After Setup

Once the base class is created, use it instead of [RestEndpoint](references/RestEndpoint.md) directly.

### Choosing `resource()` vs individual endpoints

**Use `resource()`** when an API module has standard CRUD on a single path (list, get, create, update, delete). This is the common case:

```ts
import { resource } from '@data-client/rest';
import { BaseEndpoint } from './BaseEndpoint';
import { Todo } from '../schemas/Todo';

export const TodoResource = resource({
  path: '/todos/:id',
  schema: Todo,
  Endpoint: BaseEndpoint,
});
// Provides: TodoResource.get, .getList, .create, .update, .delete, .partialUpdate
```

**Use standalone `new BaseEndpoint()`** for non-CRUD operations (search, auth, custom actions) or when the path doesn't match `resource()` conventions:

```ts
export const loginEndpoint = new BaseEndpoint({
  path: '/auth/login',
  method: 'POST' as const,
  body: {} as { email: string; password: string },
  schema: undefined,
});
```

**Body typing**: Use `body: {} as BodyType` (truthy value) — not `undefined as unknown as BodyType`. The truthy value is needed so the endpoint correctly sends a request body for POST/PUT/PATCH.

### Coexisting with existing validation (Zod, Yup)

If the codebase already validates responses with Zod/Yup, prefer **Entity as the source of truth** for types that benefit from caching/normalization. Keep Zod only for types that don't need normalization (auth tokens, form validation types, one-off responses). See the migration reference files for detailed options.

## Next Steps

1. **Define Entity classes** (skill "data-client-schema") and **wire them to endpoints via `schema:`** — this is essential, not optional. Endpoints with `schema: undefined` bypass normalization and caching.
2. Apply skill "data-client-rest" for resource and endpoint patterns
3. Apply skill "data-client-react" or "data-client-vue" for hook-based usage

## References

- [RestEndpoint](references/RestEndpoint.md) - Full RestEndpoint API
- [resource](references/resource.md) - Resource factory function
- [Authentication Guide](references/auth.md) - Auth patterns and examples
- [Django Integration](references/django.md) - Django REST Framework patterns
- [Axios Migration Guide](https://dataclient.io/rest/guides/axios-migration) - Full axios migration documentation
