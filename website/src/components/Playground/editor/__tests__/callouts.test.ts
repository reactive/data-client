/// <reference types="jest" />

import { calloutMarker, parseCallouts } from '../callouts';

describe('parseCallouts', () => {
  test('leaves code without callouts unchanged', () => {
    const code = 'const a = 1;\n// highlight-next-line\nconst b = 2;';
    expect(parseCallouts(code)).toEqual({
      editorValue: 'const a = 1;\nconst b = 2;',
      staticValue: code,
      callouts: [],
    });
  });

  test('attaches each callout to the next code line', () => {
    const code = [
      'class A {',
      '  // callout: Set once so the cache key is stable',
      '  // highlight-next-line',
      '  lens = selector;',
      '}',
    ].join('\n');
    expect(parseCallouts(code)).toEqual({
      editorValue: 'class A {\n  lens = selector;\n}',
      staticValue:
        'class A {\n  // highlight-next-line\n  lens = selector;  // ①\n}',
      callouts: [
        { line: 2, marker: '①', text: 'Set once so the cache key is stable' },
      ],
    });
  });

  test('continues numbering from startIndex', () => {
    const code = '// callout: one\na;\n// callout: two\n// callout: three\nb;';
    const { staticValue, callouts } = parseCallouts(code, 2);
    expect(staticValue).toBe('a;  // ③\nb;  // ④ ⑤');
    expect(callouts.map(({ line, marker }) => [line, marker])).toEqual([
      [1, '③'],
      [2, '④'],
      [2, '⑤'],
    ]);
  });
});

describe('calloutMarker', () => {
  test('uses circled digits through 20', () => {
    expect(calloutMarker(0)).toBe('①');
    expect(calloutMarker(19)).toBe('⑳');
    expect(calloutMarker(20)).toBe('(21)');
  });
});
