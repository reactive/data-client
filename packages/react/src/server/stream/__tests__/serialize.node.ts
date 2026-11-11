import vm from 'vm';

import { serialize } from '../serialize';
import { STREAM_GLOBAL } from '../wire';
import type { StreamMessage } from '../wire';

function run(source: string) {
  const context: any = {};
  context.self = context;
  vm.runInNewContext(source, context);
  return context[STREAM_GLOBAL];
}

describe('serialize', () => {
  it('gives an empty string for no messages', () => {
    expect(serialize([])).toBe('');
  });

  it('escapes what could end the script or break the line', () => {
    const messages: StreamMessage[] = [
      {
        t: 'piece',
        rev: 1,
        endpoints: {
          a: '</script><script>alert(1)</script>',
          b: '<!-- comment',
          c: 'line\u2028separator\u2029paragraph',
        },
      },
    ];
    const source = serialize(messages);
    expect(source).not.toContain('</script');
    expect(source).not.toContain('<!--');
    expect(source).not.toContain('<');
    expect(source).not.toContain('\u2028');
    expect(source).not.toContain('\u2029');
    expect(JSON.parse(JSON.stringify(run(source)))).toEqual(messages);
  });

  it('evaluates to the same messages, appended to an existing queue', () => {
    const first: StreamMessage[] = [{ t: 'open', v: 1, rev: 0, at: 5 }];
    const second: StreamMessage[] = [
      { t: 'pin', id: '_R_1_', rev: 2 },
      { t: 'ann', keys: ['GET /a'] },
      { t: 'end' },
    ];
    const context: any = {};
    context.self = context;
    vm.runInNewContext(serialize(first), context);
    vm.runInNewContext(serialize(second), context);
    expect(JSON.parse(JSON.stringify(context[STREAM_GLOBAL]))).toEqual([
      ...first,
      ...second,
    ]);
  });
});
