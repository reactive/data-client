'use strict';

const { defineInlineTest } = require('jscodeshift/dist/testUtils');

const transform = require('../v0.18');

describe('v0.18 codemod', () => {
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
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

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
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

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
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

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
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

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
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

class Lazy {
  declare _denormalizeNullable: (input: {}, delegate: IDenormalizeDelegate) => any;
}
      `,
      'rewrites class field with TSFunctionType annotation',
    );
  });

  describe('class normalize methods', () => {
    defineInlineTest(
      transform,
      { path: 'NormalizeSchema.ts' },
      `
import { Entity } from '@data-client/rest';

class Wrapper {
  normalize(
    input: any,
    parent: any,
    key: string,
    args: readonly any[],
    visit: any,
    delegate: any,
  ) {
    const value = visit(this.schema, input.value, input, 'value', args);
    return this.process(value, ...args);
  }
}
      `,
      `
import { Entity, type INormalizeDelegate } from '@data-client/rest';

class Wrapper {
  normalize(input: any, parent: any, key: string, delegate: INormalizeDelegate) {
    const value = delegate.visit(this.schema, input.value, input, 'value');
    return this.process(value, ...delegate.args);
  }
}
      `,
      'rewrites class normalize and adds INormalizeDelegate import',
    );

    defineInlineTest(
      transform,
      { path: 'NormalizeSchema.js' },
      `
import { Entity } from '@data-client/rest';

class Wrapper {
  normalize(input, parent, key, args, visit, delegate) {
    return visit(this.schema, input, parent, key, args);
  }
}
      `,
      `
import { Entity } from '@data-client/rest';

class Wrapper {
  normalize(input, parent, key, delegate) {
    return delegate.visit(this.schema, input, parent, key);
  }
}
      `,
      'rewrites class normalize without adding type import in JS files',
    );

    defineInlineTest(
      transform,
      { path: 'NormalizePassThrough.ts' },
      `
import { Entity } from '@data-client/rest';

class Wrapper {
  normalize(input: any, parent: any, key: string, args: readonly any[], visit: any, snapshot: any, parentEntity?: any) {
    return this.inner.normalize(input, parent, key, args, visit, snapshot, parentEntity);
  }
}
      `,
      `
import { Entity, type INormalizeDelegate } from '@data-client/rest';

class Wrapper {
  normalize(
    input: any,
    parent: any,
    key: string,
    snapshot: INormalizeDelegate,
    parentEntity?: any
  ) {
    return this.inner.normalize(input, parent, key, snapshot, parentEntity);
  }
}
      `,
      'rewrites pass-through .normalize(..., args, visit, delegate) calls',
    );
  });

  describe('normalize TypeScript signatures', () => {
    defineInlineTest(
      transform,
      { path: 'normalize-iface.ts' },
      `
import { Entity } from '@data-client/rest';

interface MySchema {
  normalize(input: any, parent: any, key: string, args: readonly any[], visit: (s: any, v: any, p: any, k: any, a: readonly any[]) => any, delegate: any, parentEntity?: any): any;
}
      `,
      `
import { Entity, type INormalizeDelegate } from '@data-client/rest';

interface MySchema {
  normalize(
    input: any,
    parent: any,
    key: string,
    delegate: INormalizeDelegate,
    parentEntity?: any
  ): any
}
      `,
      'rewrites TS interface normalize method signature',
    );

    defineInlineTest(
      transform,
      { path: 'normalize-field.ts' },
      `
import { Entity } from '@data-client/rest';

class Wrapper {
  declare normalize: (
    input: any,
    parent: any,
    key: string,
    args: readonly any[],
    visit: (s: any, v: any) => any,
    delegate: any,
  ) => any;
}
      `,
      `
import { Entity, type INormalizeDelegate } from '@data-client/rest';

class Wrapper {
  declare normalize: (input: any, parent: any, key: string, delegate: INormalizeDelegate) => any;
}
      `,
      'rewrites class field with normalize TSFunctionType annotation',
    );
  });

  describe('combined schema methods', () => {
    defineInlineTest(
      transform,
      { path: 'Combined.ts' },
      `
import { Entity } from '@data-client/rest';

class Wrapper {
  normalize(input: any, parent: any, key: string, args: readonly any[], visit: any, delegate: any) {
    return visit(this.schema, input, parent, key, args);
  }
  denormalize(input: any, args: readonly any[], unvisit: any) {
    return unvisit(this.schema, input);
  }
}
      `,
      `
import { Entity, type IDenormalizeDelegate, type INormalizeDelegate } from '@data-client/rest';

class Wrapper {
  normalize(input: any, parent: any, key: string, delegate: INormalizeDelegate) {
    return delegate.visit(this.schema, input, parent, key);
  }
  denormalize(input: any, delegate: IDenormalizeDelegate) {
    return delegate.unvisit(this.schema, input);
  }
}
      `,
      'adds both normalize and denormalize delegate imports',
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
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

class Aliased {
  denormalize(input: any, delegate: IDenormalizeDelegate) {
    return input;
  }
}
      `,
      'still rewrites underscore-prefixed param names',
    );

    // Shadow handling is intentionally narrow: only nested function
    // parameters that re-bind 'args' / 'unvisit' are detected.
    // Block-scoped re-bindings inside the same body are NOT detected
    // and will be rewritten. This test locks that contract.
    defineInlineTest(
      transform,
      { path: 'NestedFn.ts' },
      `
import { Entity } from '@data-client/rest';

class Outer {
  denormalize(input: any, args: readonly any[], unvisit: any) {
    const inner = (unvisit: any) => unvisit(input);
    return inner(unvisit);
  }
}
      `,
      `
import { Entity, type IDenormalizeDelegate } from '@data-client/rest';

class Outer {
  denormalize(input: any, delegate: IDenormalizeDelegate) {
    const inner = (unvisit: any) => unvisit(input);
    return inner(delegate.unvisit);
  }
}
      `,
      'preserves nested-function shadowing of unvisit param',
    );
  });
});
