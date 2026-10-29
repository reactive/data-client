import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { parseSignature, tocLabels } = require('./remarkTocLabels.js');

const name = text => parseSignature(text)?.name;

describe('parseSignature', () => {
  it('drops static, params and return type', () => {
    assert.equal(
      name('static process(input, parent, key, args): processedEntity'),
      'process',
    );
    assert.equal(name('pk(parent?, key?, args?): string | number'), 'pk');
    assert.equal(name('static indexes?: (keyof this)[]'), 'indexes');
    assert.equal(name('Controller?: Controller class'), 'Controller');
    assert.equal(name("errorPolicy?: (error: any) => 'soft'"), 'errorPolicy');
    assert.equal(name('key: (params) => string'), 'key');
    assert.equal(
      name('constructor({ dataExpiryLength = 60000 })'),
      'constructor',
    );
    assert.equal(name('useSuspense()'), 'useSuspense');
    assert.equal(name('Endpoint.extend()'), 'Endpoint.extend');
    assert.equal(name('createCollectionFilter?'), 'createCollectionFilter');
  });

  it('leaves prose headings alone', () => {
    for (const text of [
      'Usage',
      'key',
      'Example: depth-limited relationships',
      'Why?',
      'Array relationship (most common)',
      'unshift (merge function)',
      'useGetList().push',
      'Schema.infer() -> Schema.queryKey()',
    ])
      assert.equal(parseSignature(text), undefined, text);
  });
});

describe('tocLabels', () => {
  it('keeps params when names clash', () => {
    const labels = tocLabels([
      { id: 'paginated', text: 'paginated(paginationfield)' },
      { id: 'paginated-function', text: 'paginated(removeCursor)' },
      { id: 'extend', text: 'extend(options): RestEndpoint' },
      { id: 'usage', text: 'Usage' },
    ]);
    assert.deepEqual(
      labels,
      new Map([
        ['paginated', 'paginated(paginationfield)'],
        ['paginated-function', 'paginated(removeCursor)'],
        ['extend', 'extend'],
      ]),
    );
  });
});
