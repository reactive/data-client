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
  // Docusaurus' own toc builder (an internal path), so an upgrade that
  // changes the export's shape fails here instead of silently
  const {
    createTOCExportNodeAST,
  } = require('@docusaurus/mdx-loader/lib/remark/toc/utils.js');
  const heading = (id, text) => ({
    type: 'heading',
    depth: 3,
    data: { id },
    children: [{ type: 'text', value: text }],
  });

  it("relabels Docusaurus' toc export, keeping headings and ids", async () => {
    const headings = [
      heading('process', 'static process(input, parent): processedEntity'),
      heading('paginated', 'paginated(paginationfield)'),
      heading('paginated-function', 'paginated(removeCursor)'),
      heading('usage', 'Usage'),
    ];
    const toc = await createTOCExportNodeAST({
      tocExportName: 'toc',
      tocItems: headings.map(h => ({ type: 'heading', heading: h })),
    });
    const texts = headings.map(h => h.children[0].value);

    remarkTocLabels()({ type: 'root', children: [...headings, toc] });

    const items =
      toc.data.estree.body[0].declaration.declarations[0].init.elements.map(
        item =>
          Object.fromEntries(
            item.properties.map(p => [
              p.key.name ?? p.key.value,
              p.value.value,
            ]),
          ),
      );
    assert.deepEqual(
      items.map(({ id, value }) => [id, value]),
      [
        ['process', 'process'],
        ['paginated', 'paginated'],
        ['paginated-function', 'paginated'],
        ['usage', 'Usage'],
      ],
    );
    assert.deepEqual(
      headings.map(h => h.children[0].value),
      texts,
    );
  });
});
