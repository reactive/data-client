import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  TranslationError,
  headingIds,
  pinHeadingIds,
  protectCode,
  restoreCode,
  rewriteImports,
  structureProblems,
} from './mdx.mjs';

const FILE = '/docs/core/page.md';

const source = `---
title: Getting Started
id: start
---

import Tabs from '@theme/Tabs';
import Shared from '../shared/\\_shared.mdx';

## Install \`@data-client/react\`

Read the [guide](./guide.md) or use \`useSuspense()\`.

:::tip[Use skills]

Some tip.

:::

<Tabs groupId="pkg" label="Package">

\`\`\`ts title="Resource"
const a = 1;
\`\`\`

</Tabs>

\`\`\`ts title="Resource"
const a = 1;
\`\`\`
`;

const translated = `---
title: Primeros pasos
id: start
---

import Tabs from '@theme/Tabs';
import Shared from '../shared/\\_shared.mdx';

## Instala \`@data-client/react\`

Lee la [guía](./guide.md) o usa \`useSuspense()\`.

:::tip[Usa skills]

Un consejo.

:::

<Tabs groupId="pkg" label="Paquete">

\`\`\`ts title="Resource"
const a = 1;
\`\`\`

</Tabs>

\`\`\`ts title="Resource"
const a = 1;
\`\`\`
`;

describe('protectCode', () => {
  it('round-trips, with one placeholder per distinct block', () => {
    const { text, blocks } = protectCode(source);
    assert.equal(blocks.size, 1);
    assert.doesNotMatch(text, /const a/);
    assert.equal(restoreCode(text, text, blocks), source);
  });

  it('keeps placeholders stable when other code changes', () => {
    const before = protectCode(source).text.match(/%%CODE_\w+%%/)[0];
    const after = protectCode(`\`\`\`js\nother\n\`\`\`\n\n${source}`).text;
    assert.match(after, new RegExp(before));
  });

  it('rejects a translation that dropped a block', () => {
    const { text, blocks } = protectCode(source);
    const dropped = text.replace(/\n\s*%%CODE_\w+%%\s*$/, '');
    assert.throws(() => restoreCode(dropped, text, blocks), TranslationError);
  });
});

describe('structureProblems', () => {
  it('accepts translated prose, titles, labels and link text', () => {
    assert.deepEqual(structureProblems(source, translated, FILE), []);
  });

  for (const [what, from, to] of [
    ['inline code', '`useSuspense()`', '`usarSuspense()`'],
    ['link targets', '(./guide.md)', '(./guia.md)'],
    ['JSX attributes', 'groupId="pkg"', 'groupId="paquete"'],
    ['directives', ':::tip[Usa skills]', ':::note[Usa skills]'],
    ['imports', "from '@theme/Tabs'", "from '@theme/Pestanas'"],
    ['front matter', 'id: start', 'id: inicio'],
    ['heading levels', '## Instala', '### Instala'],
    ['paragraphs', 'Un consejo.', 'Un consejo.\n\nY otro.'],
  ]) {
    it(`flags changed ${what}`, () => {
      assert.notEqual(
        structureProblems(source, translated.replace(from, to), FILE).length,
        0,
      );
    });
  }

  it('flags MDX that no longer compiles', () => {
    const [problem] = structureProblems(
      source,
      `${translated}\n<Tabs>\n`,
      FILE,
    );
    assert.match(problem, /invalid MDX/);
  });
});

describe('headingIds', () => {
  it('slugs each framework separately, after reserving explicit ids', () => {
    const page = `## Usage

:::react

## Example

:::

:::vue

## Example

:::

## Example

## Other {#usage-1}

## Usage
`;
    assert.deepEqual(headingIds(page), [
      'usage',
      'example',
      'example',
      'example-1',
      'usage-1',
      'usage-2',
    ]);
  });
});

describe('pinHeadingIds', () => {
  it('gives translated headings their English anchors', () => {
    const pinned = pinHeadingIds(translated, source);
    assert.match(
      pinned,
      /^## Instala `@data-client\/react` \{#install-data-clientreact\}$/m,
    );
  });

  it('rejects a translation with different headings', () => {
    assert.throws(
      () => pinHeadingIds(translated.replace('## Instala', 'Instala'), source),
      TranslationError,
    );
  });
});

describe('rewriteImports', () => {
  it('keeps imports the resolver keeps', () => {
    assert.equal(
      rewriteImports(translated, source, specifier => specifier),
      translated,
    );
  });

  it('points imports where the resolver says', () => {
    const out = rewriteImports(
      translated,
      source,
      () => '../../../docs/core/shared/_shared.mdx',
    );
    assert.match(
      out,
      /^import Shared from '..\/..\/..\/docs\/core\/shared\/_shared.mdx';$/m,
    );
  });

  it('handles multi-line imports', () => {
    const multi = "import {\n  a,\n} from './a.mdx';\n";
    assert.equal(
      rewriteImports(multi, multi, () => './b.mdx'),
      "import {\n  a,\n} from './b.mdx';\n",
    );
  });
});
