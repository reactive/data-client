import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { pickLocales } from './pick-locales.mjs';

const mentionedBy =
  (names = {}) =>
  name =>
    new Set(names[name]);
const pick = (changed, deleted = [], names) =>
  pickLocales(changed, deleted, mentionedBy(names));

describe('pickLocales', () => {
  it('builds only English for docs and site changes', () => {
    assert.deepEqual(
      pick([
        'docs/core/api/useSuspense.md',
        'website/src/components/Playground/index.tsx',
        'website/static/img/logo.svg',
      ]),
      ['en'],
    );
  });

  it('adds the locales whose translations or lock changed', () => {
    assert.deepEqual(
      pick([
        'docs/core/api/useQuery.md',
        'website/i18n/zh-Hans/docs/core/api/useQuery.md',
        'website/translate/lock/es.json',
      ]),
      ['en', 'es', 'zh-Hans'],
    );
  });

  it('builds every locale when every translation changed', () => {
    assert.equal(
      pick([
        'website/i18n/es/code.json',
        'website/i18n/pt-BR/code.json',
        'website/i18n/zh-Hans/code.json',
      ]),
      null,
    );
  });

  it('builds one translated locale for inputs every locale shares', () => {
    for (const file of [
      'website/docusaurus.config.ts',
      'website/translate/localeDocs.js',
      'website/translate/locales.js',
      'website/framework-docs/index.js',
      'website/framework-docs/docsToMarkdown.mjs',
      'website/framework-docs/sidebars-vue.js',
    ])
      assert.deepEqual(pick([file]), ['en', 'zh-Hans'], file);
    assert.deepEqual(
      pick(['website/docusaurus.config.ts', 'website/i18n/es/code.json']),
      ['en', 'es', 'zh-Hans'],
    );
  });

  it('ignores tooling that no build reads', () => {
    for (const file of [
      'website/framework-docs/README.md',
      'website/framework-docs/checkExamples.mjs',
      'website/framework-docs/checkBrowserSnippets.mjs',
      'website/framework-docs/skillReferences.mjs',
      'website/translate/README.md',
      'website/translate/translate.mjs',
      'website/translate/mdx.mjs',
      'website/translate/mdx.test.mjs',
      'website/translate/glossary/es.md',
    ])
      assert.deepEqual(pick([file]), ['en'], file);
  });

  it('adds the locales whose translations name a deleted file', () => {
    const names = {
      Unfold: ['pt-BR'],
      Old: ['es'],
      Shell: ['zh-Hans'],
    };
    assert.deepEqual(
      pick(
        ['website/src/components/Store/Unfold.tsx'],
        ['website/src/components/Store/Unfold.tsx'],
        names,
      ),
      ['en', 'pt-BR'],
    );
    assert.deepEqual(
      pick(['docs/rest/api/Old.md'], ['docs/rest/api/Old.md'], names),
      ['en', 'es'],
    );
    // an index is imported by its folder's name
    assert.deepEqual(
      pick(
        ['website/src/components/Shell/index.tsx'],
        ['website/src/components/Shell/index.tsx'],
        names,
      ),
      ['en', 'zh-Hans'],
    );
    assert.deepEqual(
      pick(
        ['website/static/img/unused.png'],
        ['website/static/img/unused.png'],
        names,
      ),
      ['en'],
    );
    // only docs, components and static files are imported or linked
    assert.deepEqual(
      pick(['website/scripts/Old.mjs'], ['website/scripts/Old.mjs'], names),
      ['en'],
    );
  });

  it('builds every locale for a locale the config does not list', () => {
    assert.equal(pick(['website/i18n/fr/code.json']), null);
  });
});
