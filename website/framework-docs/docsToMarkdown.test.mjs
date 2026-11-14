import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { docToMarkdown } from './docsToMarkdown.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-to-markdown-'));
after(() => fs.rmSync(dir, { recursive: true }));

let pages = 0;
/** Markdown of a page with one playground per `fixtures` expression */
function render(...fixtures) {
  const file = path.join(dir, `page${pages++}.md`);
  const playgrounds = fixtures.map(
    f =>
      `<HooksPlayground fixtures={${f}}>\n\n\`\`\`tsx title="App"\nrender(<App />);\n\`\`\`\n\n</HooksPlayground>`,
  );
  fs.writeFileSync(file, `# Page\n\n${playgrounds.join('\n\n')}\n`);
  return docToMarkdown(file, 'react');
}

const jsonBlocks = markdown =>
  [...markdown.matchAll(/```json title="([^"]+)"\n([\s\S]*?)\n```/g)].map(
    ([, title, body]) => [title, body],
  );

describe('playground fixture responses', () => {
  it('lead the playground’s code, titled with the request', () => {
    const markdown = render(`[
      {
        endpoint: new RestEndpoint({ path: '/posts/:id' }),
        args: [{ id: 5, expand: 'author' }],
        response: { id: '5', title: 'Hi' },
      },
      {
        endpoint: new RestEndpoint({ path: '/posts', method: 'POST' }),
        args: [{ title: 'New' }],
        'response': { id: '6', title: 'New' },
      },
    ]`);
    assert.deepEqual(jsonBlocks(markdown), [
      ['GET /posts/5?expand=author', '{ "id": "5", "title": "Hi" }'],
      ['POST /posts', '{ "id": "6", "title": "New" }'],
    ]);
    assert.ok(markdown.indexOf('```json') < markdown.indexOf('```tsx'));
  });

  it('wrap a response that does not fit on one line', () => {
    const [[, body]] = jsonBlocks(
      render(`[{
        endpoint: new RestEndpoint({ path: '/users' }),
        response: [
          { id: '1', name: 'A reasonably long name', email: 'a@example.com' },
          { id: '2', name: 'B' },
        ],
      }]`),
    );
    assert.equal(
      body,
      '[\n  { "id": "1", "name": "A reasonably long name", "email": "a@example.com" },\n  { "id": "2", "name": "B" }\n]',
    );
  });

  it('leave out responses that are not fixed data', () => {
    const markdown = render(`[
      { endpoint: new RestEndpoint({ path: '/a' }), response: () => ({ id: 1 }) },
      { endpoint: new RestEndpoint({ path: '/b' }), response: { at: Date.now() } },
      { endpoint: new RestEndpoint({ path: '/c' }), response: { pattern: /x/ } },
      { endpoint: new RestEndpoint({ path: '/d' }), response: { id: 1 } },
    ]`);
    assert.deepEqual(jsonBlocks(markdown), [['GET /d', '{ "id": 1 }']]);
  });

  it('skip spread and imported fixtures in a list', () => {
    const fixture = `{ endpoint: new RestEndpoint({ path: '/a' }), response: { id: 1 } }`;
    const shown = [['GET /a', '{ "id": 1 }']];
    assert.deepEqual(jsonBlocks(render(`[...more, ${fixture}]`)), shown);
    assert.deepEqual(
      jsonBlocks(
        render(`[{ endpoint: Imported.get, response: { id: 1 } }, ${fixture}]`),
      ),
      shown,
    );
  });

  it('leave out a fixture whose request the page computes', () => {
    const fixtures = [
      `{ endpoint: new RestEndpoint({ path: '/a/:id' }), args: [{ id }], response: { id: 1 } }`,
      `{ endpoint: new RestEndpoint({ path: '/a', method: METHOD }), response: { id: 1 } }`,
      `{ endpoint: new RestEndpoint({ path: '/a', urlPrefix: API }), response: { id: 1 } }`,
      `{ endpoint: new RestEndpoint({ path: '/a', ...options }), response: { id: 1 } }`,
      `{ endpoint: new RestEndpoint({ path: '/a' }), response: { id: 1 }, ...more }`,
    ];
    assert.deepEqual(jsonBlocks(render(`[${fixtures.join(', ')}]`)), []);
  });

  it('read template and signed number literals as data', () => {
    const markdown = render(
      '[{ endpoint: new RestEndpoint({ path: `/a` }), response: { n: -1, m: +1 } }]',
    );
    assert.deepEqual(jsonBlocks(markdown), [['GET /a', '{ "n": -1, "m": 1 }']]);
  });

  it('name a response the page already showed', () => {
    const fixtures = `[{ endpoint: new RestEndpoint({ path: '/a' }), response: { id: 1 } }]`;
    const markdown = render(fixtures, fixtures);
    assert.equal(jsonBlocks(markdown).length, 1);
    assert.match(markdown, /Responses as above: `GET \/a`\./);
  });

  it('print a request again when its response changed', () => {
    const fixtures = id =>
      `[{ endpoint: new RestEndpoint({ path: '/a' }), response: { id: ${id} } }]`;
    assert.equal(jsonBlocks(render(fixtures(1), fixtures(2))).length, 2);
  });
});
