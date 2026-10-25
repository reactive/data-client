'use strict';

const { defineInlineTest } = require('jscodeshift/dist/testUtils');

const transform = require('../v0.16');

describe('v0.16 codemod', () => {
  describe('path-to-regexp v6 → v8', () => {
    defineInlineTest(
      transform,
      {},
      `
import { RestEndpoint } from '@data-client/rest';
const getUser = new RestEndpoint({ path: '/users/:id(\\\\d+)/:tab?' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const getUser = new RestEndpoint({ path: '/users/:id{/:tab}' });
      `,
      'rewrites optional params and drops custom matchers in path strings',
    );
  });

  describe('schema.X namespace → direct imports', () => {
    defineInlineTest(
      transform,
      {},
      `
import { schema } from '@data-client/endpoint';
const users = new schema.Collection([User]);
      `,
      `
import { Collection } from '@data-client/endpoint';
const users = new Collection([User]);
      `,
      'imports schema members directly',
    );
  });

  describe('safety', () => {
    defineInlineTest(
      transform,
      {},
      `
import { RestEndpoint } from '@data-client/rest';
const getUser = new RestEndpoint({ path: '/users/:id' });
      `,
      `
import { RestEndpoint } from '@data-client/rest';
const getUser = new RestEndpoint({ path: '/users/:id' });
      `,
      'returns the source unchanged when nothing applies',
    );
  });
});
