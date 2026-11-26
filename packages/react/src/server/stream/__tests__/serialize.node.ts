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
        at: 0,
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

  it('carries quotes, backslashes and line breaks in strings unchanged', () => {
    const messages: StreamMessage[] = [
      {
        t: 'piece',
        at: 0,
        rev: 1,
        endpoints: {
          a: `it's a "quoted" \\ path`,
          b: 'two\nlines\ttabbed',
          "it's": "\\'",
        },
      },
    ];
    expect(JSON.parse(JSON.stringify(run(serialize(messages))))).toEqual(
      messages,
    );
  });

  it('keeps a "__proto__" key from API data as data', () => {
    // as a fetch response parsed with JSON.parse holds it: an own key
    const record = JSON.parse('{"id":"1","__proto__":{"isAdmin":true}}');
    const table = JSON.parse('{"__proto__":{"id":"x"},"BTC":{"id":"BTC"}}');
    const [piece] = run(
      serialize([
        {
          t: 'piece',
          at: 0,
          rev: 1,
          entities: { Ticker: table },
          endpoints: { k: record },
        },
      ]),
    );
    // no object's prototype came from the data
    expect(piece.endpoints.k.isAdmin).toBeUndefined();
    expect(Object.keys(piece.endpoints.k)).toEqual(['id', '__proto__']);
    expect(Object.keys(piece.entities.Ticker)).toEqual(['__proto__', 'BTC']);
    const inherited: string[] = [];
    for (const key in piece.entities.Ticker) inherited.push(key);
    expect(inherited).toEqual(['__proto__', 'BTC']);
  });

  it('carries an expiry that is not finite as null', () => {
    const [piece] = run(
      serialize([
        {
          t: 'piece',
          at: 0,
          rev: 1,
          entitiesMeta: {
            Todo: { 1: { fetchedAt: 1, date: 1, expiresAt: Infinity } },
          },
          meta: { 'GET /todo': { fetchedAt: 1, date: 1, expiresAt: Infinity } },
        },
      ]),
    );
    expect(piece.entitiesMeta.Todo['1'].expiresAt).toBeNull();
    expect(piece.meta['GET /todo'].expiresAt).toBeNull();
  });
});
