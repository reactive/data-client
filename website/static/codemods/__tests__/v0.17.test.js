'use strict';

const { defineInlineTest } = require('jscodeshift/dist/testUtils');

const transform = require('../v0.17');

describe('v0.17 codemod', () => {
  describe('class denormalize methods', () => {
    defineInlineTest(
      transform,
      { path: 'MySchema.ts' },
      `
import { Entity } from '@data-client/rest';

class MySchema {
  denormalize(input: {}, args: readonly any[], unvisit: (s: any, v: any) => any) {
    return unvisit(this.schema, input);
  }
}
      `,
      `
import { Entity, IDenormalizeDelegate } from '@data-client/rest';

class MySchema {
  denormalize(input: {}, delegate: IDenormalizeDelegate) {
    return delegate.unvisit(this.schema, input);
  }
}
      `,
      'rewrites class denormalize and adds IDenormalizeDelegate import',
    );

    defineInlineTest(
      transform,
      { path: 'MySchema.js' },
      `
import { Entity } from '@data-client/rest';

class MySchema {
  denormalize(input, args, unvisit) {
    return unvisit(this.schema, input);
  }
}
      `,
      `
import { Entity } from '@data-client/rest';

class MySchema {
  denormalize(input, delegate) {
    return delegate.unvisit(this.schema, input);
  }
}
      `,
      'rewrites class denormalize without adding type import in JS files',
    );

    defineInlineTest(
      transform,
      { path: 'PassThrough.ts' },
      `
import { Entity } from '@data-client/rest';

class Wrapper {
  denormalize(input: {}, args: readonly any[], unvisit: any) {
    return this.inner.denormalize(input, args, unvisit);
  }
}
      `,
      `
import { Entity, IDenormalizeDelegate } from '@data-client/rest';

class Wrapper {
  denormalize(input: {}, delegate: IDenormalizeDelegate) {
    return this.inner.denormalize(input, delegate);
  }
}
      `,
      'rewrites pass-through .denormalize(input, args, unvisit) calls',
    );

    defineInlineTest(
      transform,
      { path: 'WithArgs.ts' },
      `
import { Entity } from '@data-client/rest';

class WithArgs {
  denormalize(input: {}, args: readonly any[], unvisit: any) {
    const value = unvisit(this.schema, input);
    return this.process(value, ...args);
  }
}
      `,
      `
import { Entity, IDenormalizeDelegate } from '@data-client/rest';

class WithArgs {
  denormalize(input: {}, delegate: IDenormalizeDelegate) {
    const value = delegate.unvisit(this.schema, input);
    return this.process(value, ...delegate.args);
  }
}
      `,
      'rewrites bare args references inside the body',
    );
  });

  describe('TypeScript signatures', () => {
    defineInlineTest(
      transform,
      { path: 'iface.ts' },
      `
import { Entity } from '@data-client/rest';

interface MySchema {
  denormalize(input: {}, args: readonly any[], unvisit: (s: any, v: any) => any): any;
}
      `,
      `
import { Entity, IDenormalizeDelegate } from '@data-client/rest';

interface MySchema {
  denormalize(input: {}, delegate: IDenormalizeDelegate): any
}
      `,
      'rewrites TS interface method signature',
    );

    defineInlineTest(
      transform,
      { path: 'lazy.ts' },
      `
import { Entity } from '@data-client/rest';

class Lazy {
  declare _denormalizeNullable: (
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ) => any;
}
      `,
      `
import { Entity, IDenormalizeDelegate } from '@data-client/rest';

class Lazy {
  declare _denormalizeNullable: (input: {}, delegate: IDenormalizeDelegate) => any;
}
      `,
      'rewrites class field with TSFunctionType annotation',
    );
  });

  describe('safety', () => {
    defineInlineTest(
      transform,
      { path: 'Other.ts' },
      `
class Other {
  denormalize(input: any, args: any[], unvisit: any) {
    return unvisit(this.schema, input);
  }
}
      `,
      `
class Other {
  denormalize(input: any, args: any[], unvisit: any) {
    return unvisit(this.schema, input);
  }
}
      `,
      'skips files without @data-client imports',
    );

    defineInlineTest(
      transform,
      { path: 'TwoArg.ts' },
      `
import { Entity } from '@data-client/rest';

class TwoArg {
  denormalize(input: any, delegate: any) {
    return delegate.unvisit(this.schema, input);
  }
}
      `,
      `
import { Entity } from '@data-client/rest';

class TwoArg {
  denormalize(input: any, delegate: any) {
    return delegate.unvisit(this.schema, input);
  }
}
      `,
      'skips already-migrated 2-arg signatures',
    );

    defineInlineTest(
      transform,
      { path: 'Aliased.ts' },
      `
import { Entity } from '@data-client/rest';

class Aliased {
  denormalize(input: any, _args: readonly any[], _unvisit: any) {
    return input;
  }
}
      `,
      `
import { Entity, IDenormalizeDelegate } from '@data-client/rest';

class Aliased {
  denormalize(input: any, delegate: IDenormalizeDelegate) {
    return input;
  }
}
      `,
      'still rewrites underscore-prefixed param names',
    );
  });
});
