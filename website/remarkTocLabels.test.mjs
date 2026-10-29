import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const remarkTocLabels = require('./remarkTocLabels.js');

const name = remarkTocLabels.signatureName;

describe('signatureName', () => {
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
    assert.equal(name('paginated(removeCursor)'), 'paginated');
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
      assert.equal(name(text), undefined, text);
  });
});

describe('remarkTocLabels', () => {
  it("relabels Docusaurus' toc export, keeping heading and id", async () => {
    const {
      createTOCExportNodeAST,
    } = require('@docusaurus/mdx-loader/lib/remark/toc/utils.js');
    const text = 'static process(input, parent, key, args): processedEntity';
    const heading = {
      type: 'heading',
      depth: 3,
      data: { id: 'process' },
      children: [{ type: 'text', value: text }],
    };
    const toc = await createTOCExportNodeAST({
      tocExportName: 'toc',
      tocItems: [{ type: 'heading', heading }],
    });
    const tree = { type: 'root', children: [heading, toc] };

    remarkTocLabels()(tree);

    const item =
      toc.data.estree.body[0].declaration.declarations[0].init.elements[0];
    const prop = key =>
      item.properties.find(p => (p.key.name ?? p.key.value) === key).value
        .value;
    assert.equal(prop('value'), 'process');
    assert.equal(prop('id'), 'process');
    assert.equal(heading.children[0].value, text);
  });
});
