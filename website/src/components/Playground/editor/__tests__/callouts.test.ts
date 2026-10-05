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
        { line: 2, index: 0, text: 'Set once so the cache key is stable' },
      ],
    });
  });

  test('continues numbering from startIndex and joins wrapped callouts', () => {
    const code = '// callout: one\na;\n// callout: two\n// callout: lines\nb;';
    const { staticValue, callouts } = parseCallouts(code, 2);
    expect(staticValue).toBe('a;  // ③\nb;  // ④');
    expect(callouts).toEqual([
      { line: 1, index: 2, text: 'one' },
      { line: 2, index: 3, text: 'two lines' },
    ]);
  });

  test('warns about a callout with no code line after it', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseCallouts('a;\n// callout: dangling').callouts).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      'DiffEditor: "// callout: dangling" has no code line after it',
    );
    warn.mockRestore();
  });
});

describe('calloutMarker', () => {
  test('uses circled digits through 20', () => {
    expect(calloutMarker(0)).toBe('①');
    expect(calloutMarker(19)).toBe('⑳');
    expect(calloutMarker(20)).toBe('(21)');
  });
});
