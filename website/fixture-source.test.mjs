import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { babelPlugin, recmaPlugin } = require('./fixture-source.js');
// The Babel Docusaurus builds with (the root @babel/core is another major)
const docusaurusRequire = createRequire(require.resolve('@docusaurus/babel'));
const babel = docusaurusRequire('@babel/core');

const run = code => {
  const module = { exports: {} };
  new Function('module', 'E', code)(module, {});
  return module.exports;
};

describe('babelPlugin', () => {
  const compile = src =>
    babel.transformSync(src, {
      filename: path.resolve('src/fixtures/test.ts'),
      babelrc: false,
      configFile: false,
      presets: [docusaurusRequire.resolve('@babel/preset-typescript')],
      plugins: [babelPlugin],
    }).code;

  it('shows methods and arrows as authored, without types', () => {
    const code = compile(`module.exports = [
  {
    endpoint: E,
    async response({ id }: { id: string }) {
      return { id, post: (this.posts as any)[id]! };
    },
  },
  {
    endpoint: E,
    response: (a: number, init?: RequestInit, opts /* ? */ ?: {}): number => {
      const b = new Map<string, number>().get(String(a)) ?? a + 1;
      return b;
    },
  },
  { endpoint: E, response: (a: number) => {
      return a;
    } },
  { endpoint: E, response: (a: string) => a },
  {
    endpoint: E,
    response() {
      return \`hello
world\`;
    },
  },
  { endpoint: E, response(this: Data, a: number) {
      return (<any>a).b + <any>(a + 1);
    } },
  {
    endpoint: E,
    response: (a: number) =>
      fetchFoo(a)
        .then(r => r.json()),
  },
  {
    endpoint: E,
    response() {
      return \`a
  b
        c\`;
    },
  },
];`);
    assert.deepEqual(
      run(code).map(fixture => String(fixture.response)),
      [
        'async response({ id }) {\n  return { id, post: (this.posts)[id] };\n}',
        '(a, init, opts) => {\n  const b = new Map().get(String(a)) ?? a + 1;\n  return b;\n}',
        '(a) => {\n  return a;\n}',
        '(a) => a',
        'response() {\n  return `hello\nworld`;\n}',
        'response(a) {\n  return a.b + (a + 1);\n}',
        '(a) =>\nfetchFoo(a)\n  .then(r => r.json())',
        'response() {\n  return `a\n  b\n        c`;\n}',
      ],
    );
  });

  it('still runs the functions, with this', () => {
    const code = compile(
      `module.exports = [{ endpoint: E, response(a) { return [this, a]; } }];`,
    );
    const data = {};
    const [self, arg] = run(code)[0].response.call(data, 'a');
    assert.equal(self, data);
    assert.equal(arg, 'a');
  });

  it('leaves non-fixture objects alone', () => {
    const src = `const x = { response() { return 1; } };`;
    assert.doesNotMatch(compile(src), /toString/);
  });
});

describe('recmaPlugin', () => {
  // The MDX compiler Docusaurus builds with
  const mdxPath = createRequire(
    require.resolve('@docusaurus/mdx-loader'),
  ).resolve('@mdx-js/mdx');

  it('formats inline MDX fixtures, parenthesized ones included', async () => {
    const { compile } = await import(mdxPath);
    const out = String(
      await compile(
        `<P fixtures={[
{
endpoint: E,
response({ id }) {
return ({
id,
});
},
},
{ endpoint: E, response: ((a) => a.b) },
]} />`,
        { recmaPlugins: [recmaPlugin] },
      ),
    );
    const sources = [
      ...out.matchAll(/value: \(\) => ("(?:[^"\\]|\\.)*")/g),
    ].map(([, literal]) => JSON.parse(literal));
    assert.deepEqual(sources, [
      'response({ id }) {\n  return {\n    id,\n  };\n}',
      'a => a.b',
    ]);
  });

  it('never fails the build over a fixture it cannot format', async () => {
    const { compile } = await import(mdxPath);
    const out = String(
      await compile(
        `> <P fixtures={[{
>   endpoint: E,
>   response() {
>     return 1;
>   },
> }]} />`,
        { recmaPlugins: [recmaPlugin] },
      ),
    );
    assert.doesNotMatch(out, /toString/);
  });
});
