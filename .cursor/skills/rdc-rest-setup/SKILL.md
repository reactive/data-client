---
name: rdc-rest-setup
description: Set up @data-client/rest for REST APIs. Creates custom RestEndpoint base class with common behaviors (auth, urlPrefix, error handling). Use after rdc-setup detects REST patterns.
disable-model-invocation: true
---

# REST Protocol Setup

This skill configures `@data-client/rest` for a project. It should be applied after `rdc-setup` detects REST API patterns.

**First, apply the skill "rdc-rest"** for accurate implementation patterns.

## Installation

Install the REST package alongside the core package:

```bash
# npm
npm install @data-client/rest

# yarn
yarn add @data-client/rest

# pnpm
pnpm add @data-client/rest
```

## Custom RestEndpoint Base Class

After installing, **offer to create a custom RestEndpoint class** for the project.

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
  
  // Handle specific status codes
  if (response.status === 401) {
    // Trigger logout or token refresh
    window.dispatchEvent(new CustomEvent('auth:expired'));
  }
  
  return response;
}
```

### Custom Search Params (using qs library)

```ts
searchToString(searchParams: Record<string, any>): string {
  // For complex nested query params
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
    // Unwrap { data: ... } envelope if present
    return value?.data ?? value;
  }
}

// Helper function - implement based on project auth pattern
async function getAuthToken(): Promise<string | null> {
  // Check for valid token, refresh if needed
  return localStorage.getItem('token');
}
```

## Usage After Setup

Once the base class is created, use it instead of `RestEndpoint` directly:

```ts
import { BaseEndpoint } from './BaseEndpoint';
import { Todo } from '../schemas/Todo';

export const getTodo = new BaseEndpoint({
  path: '/todos/:id',
  schema: Todo,
});

export const updateTodo = getTodo.extend({ method: 'PUT' });
```

Or with `resource()`:

```ts
import { resource } from '@data-client/rest';
import { BaseEndpoint } from './BaseEndpoint';
import { Todo } from '../schemas/Todo';

export const TodoResource = resource({
  path: '/todos/:id',
  schema: Todo,
  Endpoint: BaseEndpoint,
});
```

## Next Steps

1. Apply skill "rdc-schema" to define Entity classes
2. Apply skill "rdc-rest" for resource and endpoint patterns
3. Apply skill "rdc-react" for hook usage

## References

- [RestEndpoint](references/RestEndpoint.md) - Full RestEndpoint API
- [resource](references/resource.md) - Resource factory function
- [Authentication Guide](references/auth.md) - Auth patterns and examples
- [Django Integration](references/django.md) - Django REST Framework patterns
