'use strict';

const fs = require('fs');
const {
  applyTransform,
  defineInlineTest,
  runInlineTest,
} = require('jscodeshift/dist/testUtils');
const os = require('os');
const path = require('path');

const transform = require('../axios-to-rest');

describe('axios-to-rest codemod', () => {
  // ── Import transforms ──────────────────────────────────────────────────

  describe('transformImports', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const x = 1;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const x = 1;
      `,
      'rewrites default axios import to RestEndpoint import',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { AxiosResponse, AxiosError } from 'axios';
const x = 1;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const x = 1;
      `,
      'removes axios type imports alongside default import',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { CancelToken } from 'axios';
const source = CancelToken.source();
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { CancelToken } from 'axios';
// TODO(data-client): use an \`AbortSignal\` instead of \`CancelToken\`: https://dataclient.io/rest/guides/axios-migration#cancellation
const source = CancelToken.source();
      `,
      'preserves CancelToken import when used at runtime',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { AxiosError } from 'axios';
try {
  throw new Error('x');
} catch (err) {
  if (err instanceof AxiosError) {
    console.log(err);
  }
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { AxiosError } from 'axios';
try {
  throw new Error('x');
} catch (err) {
  // TODO(data-client): check \`NetworkError\` instead of \`AxiosError\`: https://dataclient.io/rest/guides/axios-migration#error-handling
  if (err instanceof AxiosError) {
    console.log(err);
  }
}
      `,
      'preserves AxiosError import when used at runtime',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { AxiosResponse, isAxiosError } from 'axios';
const x = 1;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { isAxiosError } from 'axios';
const x = 1;
      `,
      'preserves unknown named imports while removing known axios type imports',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { AxiosError as Err, spread as spreadValues } from 'axios';
const x = 1;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { spread as spreadValues } from 'axios';
const x = 1;
      `,
      'preserves aliased unknown named imports from axios',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { CancelToken, AxiosError } from 'axios';
const source = CancelToken.source();
if (err instanceof AxiosError) {
  log(err);
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { CancelToken, AxiosError } from 'axios';
// TODO(data-client): use an \`AbortSignal\` instead of \`CancelToken\`: https://dataclient.io/rest/guides/axios-migration#cancellation
const source = CancelToken.source();
// TODO(data-client): check \`NetworkError\` instead of \`AxiosError\`: https://dataclient.io/rest/guides/axios-migration#error-handling
if (err instanceof AxiosError) {
  log(err);
}
      `,
      'preserves runtime CancelToken and AxiosError named imports',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { AxiosError as Err } from 'axios';
if (err instanceof Err) {
  log(err);
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { AxiosError as Err } from 'axios';
// TODO(data-client): check \`NetworkError\` instead of \`AxiosError\`: https://dataclient.io/rest/guides/axios-migration#error-handling
if (err instanceof Err) {
  log(err);
}
      `,
      'preserves aliased runtime AxiosError import when used',
    );

    defineInlineTest(
      transform,
      {},
      `
import ax from 'axios';
const x = 1;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const x = 1;
      `,
      'handles aliased default import',
    );

    defineInlineTest(
      transform,
      {},
      `const x = 1;`,
      `const x = 1;`,
      'no-op when file has no axios import (returns unchanged source)',
    );
  });

  // ── axios.create() transforms ────────────────────────────────────────

  describe('transformAxiosCreate', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({
  baseURL: 'https://api.example.com',
});
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}
      `,
      'converts axios.create with baseURL to class with urlPrefix',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: { 'X-API-Key': 'my-key' },
});
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers) {
    return {
      ...headers,
      'X-API-Key': 'my-key'
    };
  }
}
      `,
      'converts axios.create with baseURL + headers to class with urlPrefix + getHeaders',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const defaults = { Authorization: 'Bearer token' };
const api = axios.create({
  headers: { ...defaults, 'X-Key': 'val' },
});
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const defaults = { Authorization: 'Bearer token' };

class ApiEndpoint extends RestEndpoint {
  getHeaders(headers) {
    return {
      ...headers,
      ...defaults,
      'X-Key': 'val'
    };
  }
}
      `,
      'preserves spread elements in axios.create headers object',
    );

    defineInlineTest(
      transform,
      {},
      `
import ax from 'axios';
const client = ax.create({
  baseURL: 'https://example.com',
});
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ClientEndpoint extends RestEndpoint {
  urlPrefix = 'https://example.com';
}
      `,
      'handles aliased import for axios.create',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const a = axios.create({ baseURL: '/api/v1' });
const b = axios.create({ baseURL: '/api/v2' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class AEndpoint extends RestEndpoint {
  urlPrefix = '/api/v1';
}

class BEndpoint extends RestEndpoint {
  urlPrefix = '/api/v2';
}
      `,
      'handles multiple axios.create calls with unique class names',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: '/api' }), other = 123;
const result = api.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = '/api';
}

const other = 123;
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new ApiEndpoint({
  path: '/users'
})();
      `,
      'preserves sibling declarators when axios.create shares a declaration',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const other = 123, api = axios.create({ baseURL: 'https://api.example.com' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}

const other = 123;
      `,
      'preserves sibling declarators when axios.create is not the first declarator',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
export const api = axios.create({ baseURL: '/api' }), other = 123;
const result = api.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';

export class ApiEndpoint extends RestEndpoint {
  urlPrefix = '/api';
}

export const other = 123;
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new ApiEndpoint({
  path: '/users'
})();
      `,
      'preserves exported sibling declarators when axios.create shares a declaration',
    );
  });

  // ── Direct method call transforms ──────────────────────────────────

  describe('transformDirectCalls', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
      `,
      'converts axios.get to new RestEndpoint',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.post('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users',
  method: 'POST',
  body: undefined
})();
      `,
      'converts axios.post to new RestEndpoint with method POST',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.put('/users/1');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users/1',
  method: 'PUT',
  body: undefined
})();
      `,
      'converts axios.put to new RestEndpoint with method PUT',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.patch('/users/1');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users/1',
  method: 'PATCH',
  body: undefined
})();
      `,
      'converts axios.patch to new RestEndpoint with method PATCH',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.delete('/users/1');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users/1',
  method: 'DELETE'
})();
      `,
      'converts axios.delete to new RestEndpoint with method DELETE',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const url = getUrl();
const result = axios.get(url);
      `,
      `
import axios from 'axios';
const url = getUrl();
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const result = axios.get(url);
      `,
      'marks non-literal URL calls without rewriting imports',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const dynamicUrl = getUrl();
const direct = axios.get('/users');
const dynamic = axios.get(dynamicUrl);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import axios from 'axios';
const dynamicUrl = getUrl();
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const direct = new RestEndpoint({
  path: '/users'
})();
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const dynamic = axios.get(dynamicUrl);
      `,
      'keeps axios import when dynamic axios calls remain after converting literal calls',
    );
  });

  // ── Instance method calls ──────────────────────────────────────────

  describe('instance method calls', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
const result = api.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new ApiEndpoint({
  path: '/users'
})();
      `,
      'converts instance.get to new ClassName after axios.create transform',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
const result = api.post('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new ApiEndpoint({
  path: '/users',
  method: 'POST',
  body: undefined
})();
      `,
      'converts instance.post to new ClassName with method POST',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
const payload = { name: 'Taylor' };
const result = api.post('/users', payload);
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}

const payload = { name: 'Taylor' };
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new ApiEndpoint({
  path: '/users',
  method: 'POST'
})(payload);
      `,
      'converts instance.post with payload arg to avoid dangling instance references',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
const result = api.patch('/users/1', { enabled: true }, { headers: { 'X-Trace': '1' } });
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}

// TODO(data-client): move axios \`headers\` to the endpoint: https://dataclient.io/rest/guides/axios-migration#quick-reference
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new ApiEndpoint({
  path: '/users/1',
  method: 'PATCH'
})({ enabled: true });
      `,
      'converts instance.patch with payload/config args to avoid dangling instance references',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });

function fetchViaOtherClient() {
  const api = createOtherClient();
  return api.get('/shadowed');
}

const result = api.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}

function fetchViaOtherClient() {
  const api = createOtherClient();
  return api.get('/shadowed');
}

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new ApiEndpoint({
  path: '/users'
})();
      `,
      'does not rewrite shadowed instance identifiers in nested scopes',
    );
  });

  // ── TypeScript edge cases ──────────────────────────────────────────

  describe('TypeScript edge cases', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios, { AxiosResponse } from 'axios';
const result: AxiosResponse<User> = await axios.get<User>('/users/1');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const result: User = await new RestEndpoint({
  path: '/users/1'
})();
      `,
      'handles generic type parameters on axios method calls',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { AxiosResponse } from 'axios';
const data = (await axios.get('/users')) as AxiosResponse<User>;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const data = (await new RestEndpoint({
  path: '/users'
})()) as AxiosResponse<User>;
      `,
      'handles as casts with AxiosResponse',
    );

    defineInlineTest(
      transform,
      {},
      `
import type { AxiosResponse } from 'axios';
import axios from 'axios';
const result = axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
      `,
      'removes import type declaration alongside default import',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { type AxiosResponse } from 'axios';
const result = axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
      `,
      'removes inline type specifiers from import',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios, { type AxiosResponse, isAxiosError } from 'axios';
const result = axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { isAxiosError } from 'axios';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
      `,
      'removes inline type specifiers but preserves unknown named imports',
    );

    defineInlineTest(
      transform,
      {},
      `
import type { AxiosResponse } from 'axios';
const x: AxiosResponse = {};
      `,
      `
const x: AxiosResponse = {};
      `,
      'removes type-only import without adding RestEndpoint when no default import exists',
    );

    defineInlineTest(
      transform,
      {},
      `
import type { AxiosResponse } from 'axios';
      `,
      ``,
      'removes standalone type-only import',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
function foo(client: typeof axios) { return client; }
      `,
      `
import axios from 'axios';
function foo(client: typeof axios) { return client; }
      `,
      'no-op when axios is used only as typeof annotation',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
function foo(client: typeof axios) { return client; }
const result = axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import axios from 'axios';
function foo(client: typeof axios) { return client; }
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
      `,
      'preserves axios import when typeof annotation coexists with method calls',
    );

    defineInlineTest(
      transform,
      {},
      `
export { default as axios } from 'axios';
      `,
      `
export { default as axios } from 'axios';
      `,
      'leaves re-exports unchanged',
    );

    defineInlineTest(
      transform,
      {},
      `
declare module 'axios' {
  interface AxiosRequestConfig {
    customField?: string;
  }
}
      `,
      `
declare module 'axios' {
  interface AxiosRequestConfig {
    customField?: string;
  }
}
      `,
      'leaves declare module augmentations unchanged',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
import { AxiosResponse } from 'axios';
const result = axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
      `,
      'handles multiple import statements from axios without duplicate RestEndpoint imports',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
import { AxiosResponse, AxiosError } from 'axios';
const result = axios.get('/users');
const x: AxiosResponse<User> = result;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
const x: AxiosResponse<User> = result;
      `,
      'removes multiple axios imports with type references used as annotations',
    );
  });

  // ── Real-world usage patterns ──────────────────────────────────────

  describe('real-world usage patterns', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const users = axios.get('/users').then(res => res.data);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const users = new RestEndpoint({
  path: '/users'
})();
      `,
      'drops a .then() that only unwraps .data',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
async function getUsers() {
  const { data } = await axios.get('/users');
  return data;
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
async function getUsers() {
  const data = await new RestEndpoint({
    path: '/users'
  })();
  return data;
}
      `,
      'await with destructured result in async function',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios('/users');
      `,
      `
import axios from 'axios';
// TODO(data-client): replace this axios call with an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const result = axios('/users');
      `,
      'marks axios(config) calls it cannot convert',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.get('/users', { headers: { Authorization: 'Bearer token' }, params: { page: 1 } });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): move axios \`headers\` to the endpoint: https://dataclient.io/rest/guides/axios-migration#quick-reference
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})({
  page: 1
});
      `,
      'passes config params as args and marks other config options',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.request({ url: '/users', method: 'get' });
      `,
      `
import axios from 'axios';
// TODO(data-client): replace this axios call with an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const result = axios.request({ url: '/users', method: 'get' });
      `,
      'marks axios.request() calls it cannot convert',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const id = 5;
const result = axios.get(\`/users/\${id}\`);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const id = 5;
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users/:id'
})({
  id
});
      `,
      'turns template literal expressions into path params',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
export const api = axios.create({ baseURL: 'https://api.example.com' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
export class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}
      `,
      'exported axios.create() instances produce exported class declarations',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create();
      `,
      `
import { RestEndpoint } from '@data-client/rest';
class ApiEndpoint extends RestEndpoint {}
      `,
      'axios.create() with no arguments produces empty class',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
function fetchData(condition) {
  if (condition) {
    return axios.get('/a');
  } else {
    return axios.get('/b');
  }
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
function fetchData(condition) {
  if (condition) {
    // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
    return new RestEndpoint({
      path: '/a'
    })();
  } else {
    // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
    return new RestEndpoint({
      path: '/b'
    })();
  }
}
      `,
      'nested/conditional axios calls are all transformed',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.all([axios.get('/a'), axios.get('/b')]);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import axios from 'axios';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
// TODO(data-client): use \`Promise.all()\` instead of \`axios.all()\`: https://dataclient.io/rest/guides/axios-migration#call-sites
const result = axios.all([new RestEndpoint({
  path: '/a'
})(), new RestEndpoint({
  path: '/b'
})()]);
      `,
      'axios.all with nested axios.get calls transforms the gets but preserves axios.all and import',
    );
  });

  // ── Response bodies ─────────────────────────────────────────────────

  describe('reading the body instead of .data', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
async function getUser(id) {
  const res = await axios.get(\`/users/\${id}\`);
  console.log(res.data.name);
  return res.data;
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
async function getUser(id) {
  const res = await new RestEndpoint({
    path: '/users/:id'
  })({
    id
  });
  console.log(res.name);
  return res;
}
      `,
      'replaces res.data reads when the response is only read for its data',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
async function getUser() {
  return (await axios.get('/me')).data;
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
async function getUser() {
  return await new RestEndpoint({
    path: '/me'
  })();
}
      `,
      'unwraps (await call).data',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
async function getUser() {
  const { data: user } = await axios.get('/me');
  return user;
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
async function getUser() {
  const user = await new RestEndpoint({
    path: '/me'
  })();
  return user;
}
      `,
      'unwraps a renamed data destructure',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
export const response = await axios.get('/config');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
export const response = await new RestEndpoint({
  path: '/config'
})();
      `,
      'marks an exported response, since other modules may read its .data',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const search = () => axios.get('/search?q=hello+world');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const search = () => new RestEndpoint({
  path: '/search'
})({
  q: 'hello world'
});
      `,
      'decodes + in a literal query as a space',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const a = () => axios.get('/search?q=hello#results');
const b = queue => axios.post('/items', queue.shift(), { params: { id: queue.shift() } });
      `,
      `
import axios from 'axios';
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const a = () => axios.get('/search?q=hello#results');
// TODO(data-client): convert this axios.post() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const b = queue => axios.post('/items', queue.shift(), { params: { id: queue.shift() } });
      `,
      'marks fragments and params that would run before an effectful body',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const search = q => axios.get(\`/search?q=\${q}&limit=5\`).then(({ data }) => data.items);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const search = q => new RestEndpoint({
  path: '/search'
})({
  q,
  limit: '5'
}).then(data => data.items);
      `,
      'moves the query string into args and unwraps a .then() data destructure',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
async function save() {
  const { data, status } = await axios.post('/users', { name: 'a' });
  return [data, status];
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
async function save() {
  // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
  const { data, status } = await new RestEndpoint({
    path: '/users',
    method: 'POST'
  })({ name: 'a' });
  return [data, status];
}
      `,
      'marks reads of response fields other than data',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
async function remove(id) {
  await axios.delete(\`/users/\${id}\`);
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
async function remove(id) {
  await new RestEndpoint({
    path: '/users/:id',
    method: 'DELETE'
  })({
    id
  });
}
      `,
      'leaves no .data note on a call whose result is unused',
    );
  });

  // ── Urls and config ─────────────────────────────────────────────────

  describe('urls and config', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.response.use(response => response.data);
export const list = async () => (await api.get('/items')).data;
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = '/api';
}

// TODO(data-client): move this interceptor into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
api.interceptors.response.use(response => response.data);
// TODO(data-client): \`api\` has a response interceptor, so check each \`.data\` read of this call: drop it if it read axios's response, keep it if it reads the body's own field: https://dataclient.io/rest/guides/axios-migration#base-endpoint
export const list = async () => (await new ApiEndpoint({
  path: '/items'
})()).data;
      `,
      'keeps .data when a response interceptor may have unwrapped it',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const list = () => axios.get('https://user:pass@example.com/items');
const api = axios.create({ baseURL: 'https://user:pass@example.com' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import axios from 'axios';
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const list = () => axios.get('https://user:pass@example.com/items');

// TODO(data-client): fetch rejects credentials in a url: remove \`user:pass@\` from \`urlPrefix\` and send them as an \`Authorization\` header from \`getHeaders()\`: https://dataclient.io/rest/guides/axios-migration#basic-auth
class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://user:pass@example.com';
}
      `,
      'marks urls with credentials, which fetch rejects',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const list = async () => (await axios.get('/users', { params: { role: null, page: undefined, sort: 'name' } })).data;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const list = async () => await new RestEndpoint({
  path: '/users'
})({
  sort: 'name'
});
      `,
      'drops null and undefined params as axios does',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const get = id => axios.get(\`/users/\${id}\`, { params: nextFilters() });
      `,
      `
import axios from 'axios';
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const get = id => axios.get(\`/users/\${id}\`, { params: nextFilters() });
      `,
      'marks calls whose params expression would now run before the url',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const get = () => axios.get('/users?sort=name', { params: nextFilters() });
      `,
      `
import axios from 'axios';
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const get = () => axios.get('/users?sort=name', { params: nextFilters() });
      `,
      'marks spread params next to a url query, since a shared key would collapse',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const search = async (user, q) => (await axios.get(\`/users/\${encodeURIComponent(user)}/search?q=\${encodeURIComponent(q)}\`)).data;
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const search = async (user, q) => await new RestEndpoint({
  path: '/users/:user/search'
})({
  user,
  q
});
      `,
      'unwraps encodeURIComponent() since the endpoint encodes path and query values',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const save = (post, body) => axios.put(\`https://api.example.com/posts/\${post.id}\`, body, { params: { notify: true } });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const save = (post, body) => new RestEndpoint({
  urlPrefix: 'https://api.example.com',
  path: '/posts/:id',
  method: 'PUT'
})({
  id: post.id,
  notify: true
}, body);
      `,
      'splits an absolute url into urlPrefix and passes params with the body',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const get = (a, b) => axios.get(\`/files/v\${a}/\${b.id}/\${a}\`);
      `,
      `
import axios from 'axios';
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const get = (a, b) => axios.get(\`/files/v\${a}/\${b.id}/\${a}\`);
      `,
      'marks urls whose expressions do not fill a whole path segment',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const get = (a, b) => axios.get(\`/a/\${a.id}/b/\${b.id}\`);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const get = (a, b) => new RestEndpoint({
  path: '/a/:id/b/:id2'
})({
  id: a.id,
  id2: b.id
});
      `,
      'names repeated path params uniquely',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const get = id => axios.get(\`/pairs/\${id}/\${id++}/\${id}\`);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const get = id => new RestEndpoint({
  path: '/pairs/:id/:param/:id2'
})({
  id,
  param: id++,
  id2: id
});
      `,
      'reads a repeated variable again after an effectful interpolation',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const get = (id, next) => axios.get(\`/pairs/\${id}/\${id}/\${next()}\`);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const get = (id, next) => new RestEndpoint({
  path: '/pairs/:id/:id/:param'
})({
  id,
  param: next()
});
      `,
      'still shares a param between repeated reads before an effectful interpolation',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com/v1/' });
const getUser = id => api.get(\`/users/\${id}\`);
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com/v1';
}

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const getUser = id => new ApiEndpoint({
  path: '/users/:id'
})({
  id
});
      `,
      'drops a trailing slash from baseURL so it joins a leading-slash url once',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com/v1' });
const getUser = id => api.get(\`users/\${id}\`);
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com/v1';
}

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const getUser = id => new ApiEndpoint({
  path: '/users/:id'
})({
  id
});
      `,
      'adds the slash axios puts between baseURL and a relative url',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: process.env.API_URL });
const other = () => api.get('https://other.com/x');
      `,
      `
import { RestEndpoint } from '@data-client/rest';

// TODO(data-client): make sure \`urlPrefix\` has no trailing \`/\`, since every path starts with one: https://dataclient.io/rest/guides/axios-migration#base-endpoint
class ApiEndpoint extends RestEndpoint {
  urlPrefix = process.env.API_URL;
}

// TODO(data-client): convert this api.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const other = () => api.get('https://other.com/x');
      `,
      'marks a non-literal baseURL and absolute urls through an instance',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const a = id => axios.get(\`/users/\${id}\`, { params: { id: 5 } });
const b = () => axios.get('/tags?tag=red&tag=blue');
const c = () => axios.get('/progress?done=100%');
const d = ids => axios.get(\`/pairs/\${ids.shift()}/\${ids.shift()}\`);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import axios from 'axios';
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const a = id => axios.get(\`/users/\${id}\`, { params: { id: 5 } });
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const b = () => axios.get('/tags?tag=red&tag=blue');
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const c = () => axios.get('/progress?done=100%');
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const d = ids => new RestEndpoint({
  path: '/pairs/:param/:param2'
})({
  param: ids.shift(),
  param2: ids.shift()
});
      `,
      'marks query keys that clash or repeat and bad escapes, and evaluates each expression once',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const list = (id, filters) => axios.get(\`/users/\${id}/posts\`, { params: filters });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): check these query params serialize as before: axios leaves out null and undefined values and formats arrays and objects its own way; match it in \`searchToString()\`: https://dataclient.io/rest/guides/axios-migration#query-serialization
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const list = (id, filters) => new RestEndpoint({
  path: '/users/:id/posts'
})({
  ...filters,
  id
});
      `,
      'spreads non-literal params before path params and marks their serialization',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const rest = axios.create({ baseURL: '/api', ...defaults });
const t = axios.toString();
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import axios from 'axios';

// TODO(data-client): move axios \`...defaults\` to \`_RestEndpoint\`: https://dataclient.io/rest/guides/axios-migration#quick-reference
class _RestEndpoint extends RestEndpoint {
  urlPrefix = '/api';
}

// TODO(data-client): replace this axios call with an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const t = axios.toString();
      `,
      'marks spread instance options, avoids the RestEndpoint name, and ignores inherited keys',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: '/api', timeout: 5000, withCredentials: true });
api.interceptors.request.use(config => config);
      `,
      `
import { RestEndpoint } from '@data-client/rest';

// TODO(data-client): move axios \`timeout\`, \`withCredentials\` to \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#quick-reference
class ApiEndpoint extends RestEndpoint {
  urlPrefix = '/api';
}

// TODO(data-client): move this interceptor into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
api.interceptors.request.use(config => config);
      `,
      'marks instance options and interceptors it cannot move',
    );
  });

  // ── Instances from another file ────────────────────────────────────

  describe('instances imported from another file', () => {
    // each test gets its own folder, since the transform caches what it reads
    const run = (files, file) => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'axios-to-rest-'));
      for (const [name, source] of Object.entries(files))
        fs.writeFileSync(path.join(dir, name), source);
      return applyTransform(
        transform,
        {},
        {
          path: path.join(dir, file),
          source: files[file],
        },
      );
    };
    const posts = `
import { api } from './client';
export async function getPost(id: number) {
  const res = await api.get<Post>(\`/posts/\${id}\`);
  return res.data;
}
`;
    const converted = `
import { ApiEndpoint } from './client';
export async function getPost(id: number) {
  const res = await (new ApiEndpoint({
    path: '/posts/:id'
  })({
    id
  }) as Promise<Post>);
  return res;
}`.trim();

    it('converts calls on an instance a client module exports', () => {
      const client = `
import axios from 'axios';
export const api = axios.create({ baseURL: 'https://api.example.com' });
`;
      expect(run({ 'client.ts': client, 'posts.ts': posts }, 'posts.ts')).toBe(
        converted,
      );
    });

    it('converts calls once the client module is rewritten', () => {
      const client = `
import { RestEndpoint, RestGenerics } from '@data-client/rest';
export class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';
}
`;
      expect(run({ 'client.ts': client, 'posts.ts': posts }, 'posts.ts')).toBe(
        converted,
      );
    });

    it('follows an aliased import', () => {
      const client = `
import axios from 'axios';
export const api = axios.create();
`;
      const source = `
import { api as http } from './client';
export function listPosts() {
  return http.get('/posts').then(res => res.data);
}
`;
      expect(run({ 'client.ts': client, 'posts.ts': source }, 'posts.ts')).toBe(
        `
import { ApiEndpoint } from './client';
export function listPosts() {
  return new ApiEndpoint({
    path: '/posts'
  })();
}`.trim(),
      );
    });

    it('keeps .data when the client module has a response interceptor', () => {
      const client = `
import axios from 'axios';
export const api = axios.create();
api.interceptors.response.use(res => res.data);
`;
      expect(run({ 'client.ts': client, 'posts.ts': posts }, 'posts.ts')).toBe(
        `
import { ApiEndpoint } from './client';
export async function getPost(id: number) {
  // TODO(data-client): \`api\` has a response interceptor, so check each \`.data\` read of this call: drop it if it read axios's response, keep it if it reads the body's own field: https://dataclient.io/rest/guides/axios-migration#base-endpoint
  const res = await (new ApiEndpoint({
    path: '/posts/:id'
  })({
    id
  }) as Promise<Post>);
  return res.data;
}`.trim(),
      );
    });

    it('exports the class where the module exported the instance', () => {
      const client = `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
export { api };
`;
      expect(run({ 'client.ts': client }, 'client.ts')).toBe(
        `
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';
}

export { ApiEndpoint };`.trim(),
      );
      expect(run({ 'client.ts': client, 'posts.ts': posts }, 'posts.ts')).toBe(
        converted,
      );
    });

    it('imports an aliased export under its alias', () => {
      const client = `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
export { api as client };
`;
      const source = posts.replace('{ api }', '{ client as api }');
      const want = converted.replace(
        '{ ApiEndpoint }',
        '{ client as ApiEndpoint }',
      );
      expect(run({ 'client.ts': client }, 'client.ts')).toMatch(
        /export \{ ApiEndpoint as client \};$/,
      );
      // before and after the client module is rewritten
      expect(run({ 'client.ts': client, 'posts.ts': source }, 'posts.ts')).toBe(
        want,
      );
      const rewritten = run({ 'client.ts': client }, 'client.ts');
      expect(
        run({ 'client.ts': rewritten, 'posts.ts': source }, 'posts.ts'),
      ).toBe(want);
    });

    it('follows a default export', () => {
      const client = `
import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.example.com' });
export default api;
`;
      const source = posts.replace('{ api }', 'api');
      expect(run({ 'client.ts': client }, 'client.ts')).toMatch(
        /export default ApiEndpoint;$/,
      );
      expect(run({ 'client.ts': client, 'posts.ts': source }, 'posts.ts')).toBe(
        converted.replace('{ ApiEndpoint }', 'ApiEndpoint'),
      );
    });

    it('marks what it leaves of an imported instance', () => {
      const client = `
import axios from 'axios';
export const api = axios.create();
`;
      const source = `
import { api } from './client';
api.defaults.headers.common.X = '1';
`;
      expect(run({ 'client.ts': client, 'setup.ts': source }, 'setup.ts')).toBe(
        `
import { ApiEndpoint } from './client';
// TODO(data-client): move these defaults into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
api.defaults.headers.common.X = '1';`.trim(),
      );
    });

    it('resolves tsconfig path aliases', () => {
      const client = `
import axios from 'axios';
export const api = axios.create({ baseURL: 'https://api.example.com' });
`;
      const tsconfig = `{
  // comments are allowed here
  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./*"], }, },
}`;
      expect(
        run(
          {
            'tsconfig.json': tsconfig,
            'client.ts': client,
            'posts.ts': posts.replace("'./client'", "'@/client'"),
          },
          'posts.ts',
        ),
      ).toBe(converted.replace("'./client'", "'@/client'"));
    });

    it('leaves other imports with a get() alone', () => {
      const source = `
import { cache } from './cache';
export const hit = cache.get('posts');
`;
      expect(
        run(
          { 'cache.ts': 'export const cache = new Map();\n', 'use.ts': source },
          'use.ts',
        ),
      ).toBe(source.trim());
    });
  });

  // ── TypeScript ──────────────────────────────────────────────────────

  describe('TypeScript files', () => {
    const tsTest = (input, output, name) =>
      it(name, () => {
        runInlineTest(transform, {}, { source: input, path: 'api.ts' }, output);
      });

    tsTest(
      `
import axios, { AxiosResponse } from 'axios';
const api = axios.create({ baseURL: '/api', headers: { 'X-App': 'web' } });
interface User { id: string }
export async function getUser(id: string) {
  const res: AxiosResponse<User> = await api.get(\`/users/\${id}\`);
  return res.data;
}
export async function listUsers(page: number) {
  const { data } = await api.get<User[]>('/users', { params: { page } });
  return data;
}
      `,
      `
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = '/api';

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      'X-App': 'web'
    };
  }
}

interface User { id: string }
export async function getUser(id: string) {
  const res: User = await new ApiEndpoint({
    path: '/users/:id'
  })({
    id
  });
  return res;
}
export async function listUsers(page: number) {
  // TODO(data-client): check these query params serialize as before: axios leaves out null and undefined values and formats arrays and objects its own way; match it in \`searchToString()\`: https://dataclient.io/rest/guides/axios-migration#query-serialization
  const data = await (new ApiEndpoint({
    path: '/users',
    searchParams: {} as Record<string, unknown>
  })({
    page
  }) as Promise<User[]>);
  return data;
}
      `,
      'keeps types: a generic base class, the response type as a cast and untyped query params',
    );

    tsTest(
      `
import type { RestGenerics } from '@data-client/rest';
import axios from 'axios';
export const save = (u: object) => axios.post('/users', u);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import type { RestGenerics } from '@data-client/rest';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
export const save = (u: object) => new RestEndpoint({
  path: '/users',
  method: 'POST'
})(u);
      `,
      'adds a value import beside an import type',
    );
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    defineInlineTest(
      transform,
      {},
      `
import { something } from 'other-lib';
const x = something();
      `,
      `
import { something } from 'other-lib';
const x = something();
      `,
      'returns unchanged source when no axios import exists',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
import { useState } from 'react';
const [state, setState] = useState(null);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import { useState } from 'react';
const [state, setState] = useState(null);
      `,
      'preserves non-axios imports and code',
    );
  });
});
