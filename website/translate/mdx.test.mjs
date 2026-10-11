import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

import {
  TranslationError,
  headingIds,
  pinHeadingIds,
  structureProblems,
} from './mdx.mjs';

const require = createRequire(import.meta.url);
const { relativeImports } = require('./localeDocs.js');
const remarkJoinCjkLines = require('./remarkJoinCjkLines.js');

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

  it('flags a sentence left in English, not a short name', () => {
    const english =
      '## Data Client\n\nRead the guide before you start.\n\n## Install it now please {#install}\n\n## process(input, parent, key, args): boolean\n';
    assert.deepEqual(structureProblems(english, english, FILE), [
      'not translated: Read the guide before you start.',
      'not translated: Install it now please',
    ]);
    assert.deepEqual(
      structureProblems(
        english,
        english
          .replace(
            'Read the guide before you start.',
            'Lee la guía antes de empezar.',
          )
          .replace('Install it now please', 'Instálalo ahora por favor'),
        FILE,
      ),
      [],
    );
  });

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

describe('headingIds', () => {
  it('asks for an explicit id when frameworks would slug a heading apart', () => {
    assert.throws(
      () => headingIds('## Tell :react[React]:vue[Vue] to update\n'),
      TranslationError,
    );
    assert.deepEqual(
      headingIds('## Tell :react[React]:vue[Vue] to update {#tell}\n'),
      ['tell'],
    );
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

describe('relativeImports', () => {
  it('finds relative imports outside code, multi-line ones included', () => {
    const page = `${source}
import {
  a,
} from './a.mdx';

\`\`\`js
import b from './b.js';
\`\`\`
`;
    assert.deepEqual(
      relativeImports(page).map(({ specifier }) => specifier),
      ['../shared/\\_shared.mdx', './a.mdx'],
    );
  });
});

describe('remarkJoinCjkLines', () => {
  it('drops line breaks between Chinese characters, not next to Latin', () => {
    const text = value => ({ type: 'text', value });
    const paragraph = {
      type: 'paragraph',
      children: [
        text('访问。\n这样通过\n'),
        { type: 'link', children: [text('副作用')] },
        text('\n处理 endpoint\n中'),
        { type: 'strong', children: [text('粗体')] },
        text('\n'),
        { type: 'link', children: [text('链接')] },
      ],
    };
    remarkJoinCjkLines()({ type: 'root', children: [paragraph] });
    assert.deepEqual(
      paragraph.children.map(({ value }) => value),
      [
        '访问。这样通过',
        undefined,
        '处理 endpoint\n中',
        undefined,
        '',
        undefined,
      ],
    );
  });
});
