'use strict';

const { spawnSync } = require('child_process');
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
// TODO(data-client): replace axios's \`CancelToken\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
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
// TODO(data-client): replace axios's \`AxiosError\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
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
// TODO(data-client): replace axios's \`isAxiosError\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
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
// TODO(data-client): replace axios's \`spreadValues\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
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
// TODO(data-client): replace axios's \`CancelToken\`, \`AxiosError\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
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
// TODO(data-client): replace axios's \`Err\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
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
const other = 123;

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}
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

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const baseURL = '/api', api = axios.create({ baseURL });
export async function getUsers() {
  const { data } = await api.get('/users');
  return data;
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const baseURL = '/api';

// TODO(data-client): make sure \`urlPrefix\` has no trailing \`/\`, since every path starts with one: https://dataclient.io/rest/guides/axios-migration#base-endpoint
class ApiEndpoint extends RestEndpoint {
  urlPrefix = baseURL;
}

const getUsersEndpoint = new ApiEndpoint({
  path: '/users'
});

export async function getUsers() {
  const data = await getUsersEndpoint();
  return data;
}
      `,
      'defines the class and its endpoints after the config declared beside it',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
export const baseURL = '/api', api = axios.create({ baseURL }), users = api.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
export const baseURL = '/api';

// TODO(data-client): make sure \`urlPrefix\` has no trailing \`/\`, since every path starts with one: https://dataclient.io/rest/guides/axios-migration#base-endpoint
export class ApiEndpoint extends RestEndpoint {
  urlPrefix = baseURL;
}

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
export const users = new ApiEndpoint({
  path: '/users'
})();
      `,
      'defines the class between the declarators it reads and those that use it',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
// clients
export const x = 1, a = axios.create({ baseURL: '/a' }), y = 2, b = axios.create({ baseURL: '/b' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';

// clients
export const x = 1;

export class AEndpoint extends RestEndpoint {
  urlPrefix = '/a';
}

export const y = 2;

export class BEndpoint extends RestEndpoint {
  urlPrefix = '/b';
}
      `,
      'converts two clients declared in one statement',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
// the API client
const a = axios.create({ baseURL: '/a' }), b = 1, c = 2;
      `,
      `
import { RestEndpoint } from '@data-client/rest';

// the API client
class AEndpoint extends RestEndpoint {
  urlPrefix = '/a';
}

const b = 1, c = 2;
      `,
      'keeps the comment and groups the other variables when the client comes first',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
for (let a = axios.create({ baseURL: '/a' }), i = 0; i < 1; i++) {}
      `,
      `
import axios from 'axios';
for (// TODO(data-client): replace this axios call with an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
let a = axios.create({ baseURL: '/a' }), i = 0; i < 1; i++) {}
      `,
      'marks a client in a for initializer instead of converting it',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
for (let a = axios.create({ baseURL: '/a' }); a; ) {}
      `,
      `
import axios from 'axios';
for (// TODO(data-client): replace this axios call with an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
let a = axios.create({ baseURL: '/a' }); a; ) {}
      `,
      'marks a lone client in a for initializer instead of converting it',
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
// TODO(data-client): replace axios's \`AxiosResponse\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
import { AxiosResponse } from 'axios';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const data = (await new RestEndpoint({
  path: '/users'
})()) as AxiosResponse<User>;
      `,
      'keeps AxiosResponse while a cast still names it',
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
// TODO(data-client): replace axios's \`isAxiosError\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
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
// TODO(data-client): replace axios's \`AxiosResponse\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
import type { AxiosResponse } from 'axios';
const x: AxiosResponse = {};
      `,
      'keeps a type-only import its code still names, without adding RestEndpoint',
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
// TODO(data-client): replace axios's \`AxiosResponse\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
import { AxiosResponse } from 'axios';
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const result = new RestEndpoint({
  path: '/users'
})();
const x: AxiosResponse<User> = result;
      `,
      'keeps a type an annotation still names and drops the rest',
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

const getUsersEndpoint = new RestEndpoint({
  path: '/users'
});

async function getUsers() {
  const data = await getUsersEndpoint();
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

const getAEndpoint = new RestEndpoint({
  path: '/a'
});

const getBEndpoint = new RestEndpoint({
  path: '/b'
});

function fetchData(condition) {
  if (condition) {
    // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
    return getAEndpoint();
  } else {
    // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
    return getBEndpoint();
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

const getUserEndpoint = new RestEndpoint({
  path: '/users/:id'
});

async function getUser(id) {
  const res = await getUserEndpoint({
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

const getUserEndpoint = new RestEndpoint({
  path: '/me'
});

async function getUser() {
  return await getUserEndpoint();
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

const getUserEndpoint = new RestEndpoint({
  path: '/me'
});

async function getUser() {
  const user = await getUserEndpoint();
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

const searchEndpoint = new RestEndpoint({
  path: '/search'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const search = () => searchEndpoint({
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

const searchEndpoint = new RestEndpoint({
  path: '/search'
});

const search = q => searchEndpoint({
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

const saveEndpoint = new RestEndpoint({
  path: '/users',
  method: 'POST'
});

async function save() {
  // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
  const { data, status } = await saveEndpoint({ name: 'a' });
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

const removeEndpoint = new RestEndpoint({
  path: '/users/:id',
  method: 'DELETE'
});

async function remove(id) {
  await removeEndpoint({
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

const listEndpoint = new ApiEndpoint({
  path: '/items'
});

// TODO(data-client): \`api\` is the \`ApiEndpoint\` class now, so this interceptor is commented out; move it into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
// api.interceptors.response.use(response => response.data);
// TODO(data-client): \`api\` has a response interceptor, so check each \`.data\` read of this call: drop it if it read axios's response, keep it if it reads the body's own field: https://dataclient.io/rest/guides/axios-migration#base-endpoint
export const list = async () => (await listEndpoint()).data;
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

const listEndpoint = new RestEndpoint({
  path: '/users'
});

const list = async () => await listEndpoint({
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

const searchEndpoint = new RestEndpoint({
  path: '/users/:user/search'
});

const search = async (user, q) => await searchEndpoint({
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

const saveEndpoint = new RestEndpoint({
  urlPrefix: 'https://api.example.com',
  path: '/posts/:id',
  method: 'PUT'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const save = (post, body) => saveEndpoint({
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

const getEndpoint = new RestEndpoint({
  path: '/a/:id/b/:id2'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const get = (a, b) => getEndpoint({
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

const getEndpoint = new RestEndpoint({
  path: '/pairs/:id/:param/:id2'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const get = id => getEndpoint({
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

const getEndpoint = new RestEndpoint({
  path: '/pairs/:id/:id/:param'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const get = (id, next) => getEndpoint({
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

const getUserEndpoint = new ApiEndpoint({
  path: '/users/:id'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const getUser = id => getUserEndpoint({
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

const getUserEndpoint = new ApiEndpoint({
  path: '/users/:id'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const getUser = id => getUserEndpoint({
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

const dEndpoint = new RestEndpoint({
  path: '/pairs/:param/:param2'
});

// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const a = id => axios.get(\`/users/\${id}\`, { params: { id: 5 } });
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const b = () => axios.get('/tags?tag=red&tag=blue');
// TODO(data-client): convert this axios.get() call to an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
const c = () => axios.get('/progress?done=100%');
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const d = ids => dEndpoint({
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

const listEndpoint = new RestEndpoint({
  path: '/users/:id/posts'
});

// TODO(data-client): check these query params serialize as before: axios leaves out null and undefined values and formats arrays and objects its own way; match it in \`searchToString()\`: https://dataclient.io/rest/guides/axios-migration#query-serialization
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
const list = (id, filters) => listEndpoint({
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

// TODO(data-client): \`api\` is the \`ApiEndpoint\` class now, so this interceptor is commented out; move it into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
// api.interceptors.request.use(config => config);
      `,
      'marks instance options and interceptors it cannot move',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
// unwrap the body
api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error),
);

api.defaults.headers.common['X-App'] = 'web';
export function setToken(token) {
  api.defaults.headers.common.Authorization = token;
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';

class ApiEndpoint extends RestEndpoint {
  urlPrefix = '/api';
}

// unwrap the body
// TODO(data-client): \`api\` is the \`ApiEndpoint\` class now, so this interceptor is commented out; move it into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
// api.interceptors.response.use(
//   response => response.data,
//   error => Promise.reject(error),
// );

// TODO(data-client): \`api\` is the \`ApiEndpoint\` class now, so these defaults are commented out; move them into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
// api.defaults.headers.common['X-App'] = 'web';
export function setToken(token) {
  // TODO(data-client): move these defaults into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
  api.defaults.headers.common.Authorization = token;
}
      `,
      'comments out module setup on the removed instance, but only marks it inside functions',
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

const getPostEndpoint = new ApiEndpoint({
  path: '/posts/:id'
});

export async function getPost(id: number) {
  const res = await (getPostEndpoint({
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

    it('builds endpoints inline when the client module imports this one', () => {
      const client = `
import axios from 'axios';
import { getPost } from './posts';
export const api = axios.create({ baseURL: 'https://api.example.com' });
export const preload = () => getPost(1);
`;
      expect(run({ 'client.ts': client, 'posts.ts': posts }, 'posts.ts')).toBe(
        `
import { ApiEndpoint } from './client';
export async function getPost(id: number) {
  const res = await (new ApiEndpoint({
    path: '/posts/:id'
  })({
    id
  }) as Promise<Post>);
  return res;
}`.trim(),
      );
    });

    it('still hoists when the client module imports only a type from this one', () => {
      const client = `
import axios from 'axios';
import type { Post } from './posts';
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

const listPostsEndpoint = new ApiEndpoint({
  path: '/posts'
});

export function listPosts() {
  return listPostsEndpoint();
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

const getPostEndpoint = new ApiEndpoint({
  path: '/posts/:id'
});

export async function getPost(id: number) {
  // TODO(data-client): \`api\` has a response interceptor, so check each \`.data\` read of this call: drop it if it read axios's response, keep it if it reads the body's own field: https://dataclient.io/rest/guides/axios-migration#base-endpoint
  const res = await (getPostEndpoint({
    id
  }) as Promise<Post>);
  return res.data;
}`.trim(),
      );
    });

    it.each([
      ['LF', text => text],
      // a project's formatter may keep CRLF line endings
      ['CRLF', text => text.replace(/\n/g, '\r\n')],
    ])(
      'keeps .data when the rewritten client module (%s) commented out its response interceptor',
      (_, lineEndings) => {
        const client = `
import axios from 'axios';
export const api = axios.create();
api.interceptors.response.use(res => res.data);
`;
        const rewritten = run({ 'client.ts': client }, 'client.ts');
        expect(rewritten).toMatch('// api.interceptors.response.use(');
        expect(
          run(
            { 'client.ts': lineEndings(rewritten), 'posts.ts': posts },
            'posts.ts',
          ),
        ).toMatch('return res.data;');
      },
    );

    it('unwraps .data when the client only has an interceptor the author disabled', () => {
      const client = `
import axios from 'axios';
export const api = axios.create();
// api.interceptors.response.use(res => res.data);
`;
      const result = run(
        { 'client.ts': client, 'posts.ts': posts },
        'posts.ts',
      );
      expect(result).not.toMatch('res.data');
      expect(result).not.toMatch('response interceptor');
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
// TODO(data-client): \`api\` is the \`ApiEndpoint\` class now, so these defaults are commented out; move them into \`ApiEndpoint\`: https://dataclient.io/rest/guides/axios-migration#base-endpoint
// api.defaults.headers.common.X = '1';`.trim(),
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

const getUserEndpoint = new ApiEndpoint({
  path: '/users/:id'
});

const listUsersEndpoint = new ApiEndpoint({
  path: '/users',
  searchParams: {} as Record<string, unknown>
});

interface User { id: string }
export async function getUser(id: string) {
  const res: User = await getUserEndpoint({
    id
  });
  return res;
}
export async function listUsers(page: number) {
  // TODO(data-client): check these query params serialize as before: axios leaves out null and undefined values and formats arrays and objects its own way; match it in \`searchToString()\`: https://dataclient.io/rest/guides/axios-migration#query-serialization
  const data = await (listUsersEndpoint({
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

const saveEndpoint = new RestEndpoint({
  path: '/users',
  method: 'POST'
});

// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
export const save = (u: object) => saveEndpoint(u);
      `,
      'adds a value import beside an import type',
    );

    tsTest(
      `
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
const api = axios.create({ baseURL: '/api' });
interface User { id: string }
export function withAuth(config: AxiosRequestConfig): AxiosRequestConfig {
  return { ...config, headers: { Authorization: 'token' } };
}
export async function getUser(id: string) {
  const res: AxiosResponse<User> = await api.get<User>(\`/users/\${id}\`);
  return res.data;
}
      `,
      `
import { RestEndpoint, RestGenerics } from '@data-client/rest';
// TODO(data-client): replace axios's \`AxiosRequestConfig\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
import { AxiosRequestConfig } from 'axios';

class ApiEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = '/api';
}

const getUserEndpoint = new ApiEndpoint({
  path: '/users/:id'
});

interface User { id: string }
export function withAuth(config: AxiosRequestConfig): AxiosRequestConfig {
  return { ...config, headers: { Authorization: 'token' } };
}
export async function getUser(id: string) {
  const res: User = await (getUserEndpoint({
    id
  }) as Promise<User>);
  return res;
}
      `,
      'keeps an axios type that a helper still names, and marks it',
    );

    tsTest(
      `
import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
export const config: AxiosRequestConfig = {};
export const load = () => axios.get('/users').then(res => res.data);
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): replace axios's \`AxiosRequestConfig\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
import type { AxiosRequestConfig } from 'axios';

const loadEndpoint = new RestEndpoint({
  path: '/users'
});

export const config: AxiosRequestConfig = {};
export const load = () => loadEndpoint();
      `,
      'keeps the used names of an import type declaration',
    );

    tsTest(
      `
import axios, { AxiosResponse } from 'axios';
export type Shape = { AxiosResponse: number };
export type Methods = { AxiosResponse(): void };
export type Qualified = Other.AxiosResponse;
export enum Kind { AxiosResponse = 1 }
export class Holder {
  AxiosResponse = 1;
}
export class Overloads {
  AxiosResponse(a: string): void;
  AxiosResponse() {}
}
export const store = { AxiosResponse() {} };
export const load = () => axios.get('/users').then(res => res.data);
      `,
      `
import { RestEndpoint } from '@data-client/rest';

const loadEndpoint = new RestEndpoint({
  path: '/users'
});

export type Shape = { AxiosResponse: number };
export type Methods = { AxiosResponse(): void };
export type Qualified = Other.AxiosResponse;
export enum Kind { AxiosResponse = 1 }
export class Holder {
  AxiosResponse = 1;
}
export class Overloads {
  AxiosResponse(a: string): void;
  AxiosResponse() {}
}
export const store = { AxiosResponse() {} };
export const load = () => loadEndpoint();
      `,
      'drops a type that only member keys and qualified names spell',
    );

    tsTest(
      `
import axios, { AxiosHeaders } from 'axios';
export const headers = new AxiosHeaders();
export const load = () => axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): replace axios's \`AxiosHeaders\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
import { AxiosHeaders } from 'axios';

const loadEndpoint = new RestEndpoint({
  path: '/users'
});

export const headers = new AxiosHeaders();
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
export const load = () => loadEndpoint();
      `,
      'marks a listed axios name that code still constructs',
    );

    tsTest(
      `
import axios from 'axios';
import fs = require('fs');
export function load() {
  return axios.get('/users');
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
import fs = require('fs');

const loadEndpoint = new RestEndpoint({
  path: '/users'
});

export function load() {
  // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
  return loadEndpoint();
}
      `,
      'puts endpoints after an import-equals declaration',
    );

    tsTest(
      `
import axios, { AxiosError } from 'axios';
export function message(error: AxiosError) {
  return error.message;
}
export const load = () => axios.get('/users');
      `,
      `
import { RestEndpoint } from '@data-client/rest';
// TODO(data-client): replace axios's \`AxiosError\`, then remove this import: https://dataclient.io/rest/guides/axios-migration#remove-axios
import { AxiosError } from 'axios';

const loadEndpoint = new RestEndpoint({
  path: '/users'
});

export function message(error: AxiosError) {
  return error.message;
}
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
export const load = () => loadEndpoint();
      `,
      'keeps AxiosError used only as a type, and marks it like one',
    );

    tsTest(
      `
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
export const config: AxiosRequestConfig = {};
export const t = axios.toString();
      `,
      `
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
export const config: AxiosRequestConfig = {};
// TODO(data-client): replace this axios call with an endpoint: https://dataclient.io/rest/guides/axios-migration#call-sites
export const t = axios.toString();
      `,
      'keeps a used import type while axios itself is still used, without a mark',
    );
  });

  // ── Building each endpoint once ─────────────────────────────────────

  describe('hoisting endpoints out of functions', () => {
    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
export async function loadDashboard(id) {
  const user = await axios.get(\`/users/\${id}\`);
  const posts = await axios.get('/posts', { params: { author: id }, timeout: 1000 });
  return [user.data, posts.data];
}
export async function getUser(id) {
  const { data } = await axios.get(\`/users/\${id}\`);
  return data;
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';

const getUsersEndpoint = new RestEndpoint({
  path: '/users/:id'
});

// TODO(data-client): move axios \`timeout\` to \`getPostsEndpoint\`: https://dataclient.io/rest/guides/axios-migration#timeout
const getPostsEndpoint = new RestEndpoint({
  path: '/posts'
});

const getUserEndpoint = new RestEndpoint({
  path: '/users/:id'
});

export async function loadDashboard(id) {
  const user = await getUsersEndpoint({
    id
  });
  // TODO(data-client): check these query params serialize as before: axios leaves out null and undefined values and formats arrays and objects its own way; match it in \`searchToString()\`: https://dataclient.io/rest/guides/axios-migration#query-serialization
  const posts = await getPostsEndpoint({
    author: id
  });
  return [user, posts];
}
export async function getUser(id) {
  const data = await getUserEndpoint({
    id
  });
  return data;
}
      `,
      'names the endpoints of a function with several by method and path, and puts option TODOs on them',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const getUserEndpoint = 1;
export const store = {
  getUser(id) {
    return axios.get(\`/users/\${id}\`).then(res => res.data);
  },
  'save-user': user => axios.put(\`/users/\${user.id}\`, user),
};
class Repo {
  load = () => axios.get('/repos');
  #remove(id) {
    return axios.delete(\`/repos/\${id}\`);
  }
}
useEffect(() => {
  axios.post('/visits');
}, []);
      `,
      `
import { RestEndpoint } from '@data-client/rest';

const getUserEndpoint2 = new RestEndpoint({
  path: '/users/:id'
});

const saveUserEndpoint = new RestEndpoint({
  path: '/users/:id',
  method: 'PUT'
});

const loadEndpoint = new RestEndpoint({
  path: '/repos'
});

const removeEndpoint = new RestEndpoint({
  path: '/repos/:id',
  method: 'DELETE'
});

const postVisitsEndpoint = new RestEndpoint({
  path: '/visits',
  method: 'POST',
  body: undefined
});

const getUserEndpoint = 1;
// TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
export const store = {
  getUser(id) {
    return getUserEndpoint2({
      id
    });
  },
  'save-user': user => saveUserEndpoint({
    id: user.id
  }, user),
};
class Repo {
  // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
  load = () => loadEndpoint();
  #remove(id) {
    // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
    return removeEndpoint({
      id
    });
  }
}
useEffect(() => {
  postVisitsEndpoint();
}, []);
      `,
      'names endpoints after methods and properties, and avoids taken names',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
export async function getUser(id) {
  const { data } = await api.get(\`/users/\${id}\`);
  return data;
}
const api = axios.create({ baseURL: '/api' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
export async function getUser(id) {
  const data = await getUserEndpoint({
    id
  });
  return data;
}

class ApiEndpoint extends RestEndpoint {
  urlPrefix = '/api';
}

const getUserEndpoint = new ApiEndpoint({
  path: '/users/:id'
});
      `,
      'puts the endpoint after a class declared below the function',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
load();
function load() {
  return axios.get('/users');
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';

const loadEndpoint = new RestEndpoint({
  path: '/users'
});

load();
function load() {
  // TODO(data-client): this resolves to the response body now, not an axios response, so drop \`.data\` (\`status\` and \`headers\` are gone too): https://dataclient.io/rest/guides/axios-migration#call-sites
  return loadEndpoint();
}
      `,
      'defines the endpoint before code that calls its function early',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
export function makeClient(baseURL) {
  const api = axios.create({ baseURL });
  return {
    async getUser(id) {
      const { data } = await api.get(\`/users/\${id}\`);
      return data;
    },
  };
}
      `,
      `
import { RestEndpoint } from '@data-client/rest';
export function makeClient(baseURL) {
  // TODO(data-client): make sure \`urlPrefix\` has no trailing \`/\`, since every path starts with one: https://dataclient.io/rest/guides/axios-migration#base-endpoint
  class ApiEndpoint extends RestEndpoint {
    urlPrefix = baseURL;
  }

  return {
    async getUser(id) {
      const data = await new ApiEndpoint({
        path: '/users/:id'
      })({
        id
      });
      return data;
    },
  };
}
      `,
      'keeps the endpoint inline when its class is local to a function',
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

  // ── Migration evals ────────────────────────────────────────────────

  // Each app folder holds files copied unchanged from a real migration, so a
  // problem record's pass criterion runs on the code that showed it. Records:
  // .agents/projects/migrations/<app>/problems.md
  describe('migration evals', () => {
    const evals = path.join(__dirname, '../../../evals/axios-to-rest');
    // in child processes, the way people run them
    const node = (args, cwd) =>
      spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });

    /** A copy of `src` in a new temp folder */
    const copyOf = src => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'axios-to-rest-'));
      fs.cpSync(src, dir, { recursive: true });
      return dir;
    };
    /** Runs the codemod's CLI on a copy of the app, and returns that folder */
    const migrate = app => {
      const dir = copyOf(path.join(evals, app));
      const { status, stderr } = node(
        [
          path.join(__dirname, '../../cli.js'),
          'axios-to-rest',
          '--extensions=ts,tsx',
          'src',
        ],
        dir,
      );
      if (status !== 0) throw new Error(stderr);
      return dir;
    };
    const filesIn = dir =>
      fs
        .readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => path.join(entry.parentPath ?? entry.path, entry.name));

    // P9: alan2207/bulletproof-react@9506629 apps/react-vite
    describe('bulletproof-react', () => {
      let dir;
      beforeAll(() => {
        dir = migrate('bulletproof-react');
      });
      afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

      // the codemod leaves formatting to the project's own fixer
      it("passes the app's prettier --check after its formatter runs", () => {
        const prettier = require.resolve('prettier/bin/prettier.cjs');
        // on a copy, so the other checks still read the codemod's own output
        const copy = copyOf(dir);
        let write, check;
        try {
          write = node([prettier, '--write', 'src'], copy);
          check = node([prettier, '--check', 'src'], copy);
        } finally {
          fs.rmSync(copy, { recursive: true, force: true });
        }
        expect(write.status).toBe(0);
        expect(check.stdout + check.stderr).not.toMatch(/\[warn\]|\[error\]/);
        expect(check.status).toBe(0);
      });

      it('leaves no reads of the removed axios instance', () => {
        const j = require('jscodeshift').withParser('tsx');
        for (const file of filesIn(path.join(dir, 'src'))) {
          const reads = j(fs.readFileSync(file, 'utf8'))
            .find(j.Identifier, { name: 'api' })
            .filter(({ node, parent }) => {
              // a key or a property name, not a read of `api`
              const { key, property, shorthand, computed } = parent.node;
              return !(
                (key === node && !shorthand && !computed) ||
                (property === node && !computed)
              );
            })
            .size();
          expect({ file, reads }).toEqual({ file, reads: 0 });
        }
      });
    });
  });
});
