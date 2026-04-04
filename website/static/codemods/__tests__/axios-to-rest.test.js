'use strict';

const { defineInlineTest } = require('jscodeshift/dist/testUtils');

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
const source = CancelToken.source();
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
const result = new ApiEndpoint({
  path: '/users'
});
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
const result = new ApiEndpoint({
  path: '/users'
});
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
const result = new RestEndpoint({
  path: '/users'
});
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
const result = new RestEndpoint({
  path: '/users',
  method: 'POST'
});
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
const result = new RestEndpoint({
  path: '/users/1',
  method: 'PUT'
});
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
const result = new RestEndpoint({
  path: '/users/1',
  method: 'PATCH'
});
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
const result = new RestEndpoint({
  path: '/users/1',
  method: 'DELETE'
});
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
      ``,
      'leaves non-literal URL calls unchanged without rewriting imports',
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
const direct = new RestEndpoint({
  path: '/users'
});
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

const result = new ApiEndpoint({
  path: '/users'
});
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

const result = new ApiEndpoint({
  path: '/users',
  method: 'POST'
});
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
const payload = { name: 'Taylor' };

class ApiEndpoint extends RestEndpoint {
  urlPrefix = 'https://api.example.com';
}

const result = new ApiEndpoint({
  path: '/users',
  method: 'POST'
});
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

const result = new ApiEndpoint({
  path: '/users/1',
  method: 'PATCH'
});
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

const result = new ApiEndpoint({
  path: '/users'
});
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
const result: AxiosResponse<User> = await new RestEndpoint({
  path: '/users/1'
});
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
const data = (await new RestEndpoint({
  path: '/users'
})) as AxiosResponse<User>;
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
const result = new RestEndpoint({
  path: '/users'
});
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
const result = new RestEndpoint({
  path: '/users'
});
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
const result = new RestEndpoint({
  path: '/users'
});
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
      ``,
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
const result = new RestEndpoint({
  path: '/users'
});
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
const result = new RestEndpoint({
  path: '/users'
});
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
const result = new RestEndpoint({
  path: '/users'
});
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
}).then(res => res.data);
      `,
      'chained .then() is preserved after transforming axios.get',
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
  const { data } = await new RestEndpoint({
    path: '/users'
  });
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
      ``,
      'axios as default function call is left unchanged (no-op)',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.get('/users', { headers: { Authorization: 'Bearer token' }, params: { page: 1 } });
      `,
      ``,
      'config object as second arg is left unchanged (no-op)',
    );

    defineInlineTest(
      transform,
      {},
      `
import axios from 'axios';
const result = axios.request({ url: '/users', method: 'get' });
      `,
      ``,
      'axios.request() is left unchanged (no-op)',
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
const result = new RestEndpoint({
  path: \`/users/\${id}\`
});
      `,
      'template literal URLs are transformed',
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
    return new RestEndpoint({
      path: '/a'
    });
  } else {
    return new RestEndpoint({
      path: '/b'
    });
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
const result = axios.all([new RestEndpoint({
  path: '/a'
}), new RestEndpoint({
  path: '/b'
})]);
      `,
      'axios.all with nested axios.get calls transforms the gets but preserves axios.all and import',
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
