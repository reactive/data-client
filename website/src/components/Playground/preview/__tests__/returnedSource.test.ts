import { returnedSource } from '../../returnedSource';

describe('returnedSource', () => {
  test.each([
    [
      'arrow expression',
      '({ id }) => ({ id, title: "a; b" })',
      '{ id, title: "a; b" }',
    ],
    ['arrow block', '(a) => {\n  const b = a;\n  return b + 1;\n}', 'b + 1'],
    [
      'method, last top-level return, multi-line literal',
      `async response(...args) {
  if (!args.length) {
    return [];
  }
  const items = list.map(item => {
    return item.id;
  });
  return {
    ...(await getList(...args)),
    id: args?.[0]?.id, // "}" here
  };
}`,
      '{ ...(await getList(...args)), id: args?.[0]?.id }',
    ],
    [
      'destructured params',
      'response({ todo }) { return { updateTodo: this[todo.id] } }',
      '{ updateTodo: this[todo.id] }',
    ],
    [
      'no semicolon before the body ends',
      'function () { return `}${x}` }',
      '`}${x}`',
    ],
  ])('%s', (_, source, expected) => {
    expect(returnedSource(source)).toBe(expected);
  });

  test('keeps parens that only wrap part of it', () => {
    expect(returnedSource('() => (a + 1) * (b)')).toBe('(a + 1) * (b)');
    expect(returnedSource('() => (")" + x)')).toBe('")" + x');
  });

  test.each([
    ['no top-level return', 'response() { if (a) { return 1; } }'],
    ['bare return', 'response() { return; }'],
    ['not a function', 'native code'],
  ])('%s is undefined', (_, source) => {
    expect(returnedSource(source)).toBeUndefined();
  });
});
