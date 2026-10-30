import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderSkillMd } from './skillSource.mjs';

const render = (body, framework = 'react') =>
  renderSkillMd(`---\nname: a\n---\n${body}`, framework, 'src.md');

describe('renderSkillMd', () => {
  it('applies this framework’s front matter overrides and drops the others', () => {
    const source = '---\nname: a-react\nvue_name: a-vue\n---\nbody';
    assert.equal(
      renderSkillMd(source, 'react', 'src.md'),
      '---\nname: a-react\n---\nbody',
    );
    assert.equal(
      renderSkillMd(source, 'vue', 'src.md'),
      '---\nname: a-vue\n---\nbody',
    );
  });

  it('keeps a block’s lines for its framework only, dropping the marker lines', () => {
    const body = '- one\n:::vue\n- vue\n:::\n:::react\n- react\n:::\n- two';
    assert.equal(render(body), '---\nname: a\n---\n- one\n- react\n- two');
    assert.equal(render(body, 'vue'), '---\nname: a\n---\n- one\n- vue\n- two');
  });

  it('picks inline text, across lines and with nested brackets', () => {
    const body = 'Use :react[[hooks](h.md)]:vue[[composables](c.md)\nnow].';
    assert.equal(render(body), '---\nname: a\n---\nUse [hooks](h.md).');
    assert.equal(
      render(body, 'vue'),
      '---\nname: a\n---\nUse [composables](c.md)\nnow.',
    );
  });

  it('leaves markers in code fences as written', () => {
    const body = '```ts\n:::vue\nf(:vue[x]);\n```';
    assert.equal(render(body), `---\nname: a\n---\n${body}`);
  });

  it('rejects malformed markers', () => {
    for (const [body, error] of [
      [':::vue\nx', /unclosed :::vue/],
      [':::vue\n:::react\n:::', /":::react" inside :::vue/],
      [':::', /closes no block/],
      [':::note\n:::', /":::note" isn't/],
      [':::vue\n:::vue note\n:::', /":::vue note" isn't/],
      ['a :vue[b', /unclosed :vue\[/],
    ])
      assert.throws(() => render(body), error);
    assert.throws(
      () => renderSkillMd('body', 'react', 'src.md'),
      /src.md: needs front matter/,
    );
  });
});
