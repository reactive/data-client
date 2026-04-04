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
      ``,
      'no-op when file has no axios import (returns undefined → empty)',
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
      `
import { RestEndpoint } from '@data-client/rest';
const url = getUrl();
const result = axios.get(url);
      `,
      'leaves non-literal URL calls unchanged',
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
      ``,
      'returns undefined (no change) when no axios import exists',
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
