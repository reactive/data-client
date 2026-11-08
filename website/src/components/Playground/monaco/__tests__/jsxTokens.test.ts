/// <reference types="jest" />
import type * as Monaco from 'monaco-editor';

import { hasJsxColors, registerJsxColors } from '../jsxTokens';

/** A model of `code` at `path`, with the position helpers the provider uses */
function fakeModel(code: string, path: string, language = 'typescript') {
  const lines = code.split('\n');
  return {
    uri: { path, toString: () => `file://${path}` },
    getValue: () => code,
    getLanguageId: () => language,
    getVersionId: () => 1,
    isDisposed: () => false,
    getLineMaxColumn: (line: number) => lines[line - 1].length + 1,
    getPositionAt(offset: number) {
      let lineNumber = 1;
      while (offset > lines[lineNumber - 1].length) {
        offset -= lines[lineNumber - 1].length + 1;
        lineNumber++;
      }
      return { lineNumber, column: offset + 1 };
    },
  } as unknown as Monaco.editor.ITextModel;
}

/** The provider registerJsxColors gives Monaco, with a worker answering
 * `spans`, and how often it asked Monaco to ask again */
function provider(spans: number[]) {
  let registered: any;
  const asked = { again: 0 };
  registerJsxColors({
    Emitter: class {
      event = () => {};
      fire = () => asked.again++;
    },
    languages: {
      registerDocumentSemanticTokensProvider: (_: string, p: unknown) =>
        (registered = p),
    },
    typescript: {
      getTypeScriptWorker: async () => async () => ({
        getJsxSpans: async () => [...spans],
      }),
    },
  } as unknown as typeof Monaco);
  return { provider: registered, asked };
}

const settle = () => new Promise(resolve => setTimeout(resolve));

const code = 'x = <A b="c">\n  hi\n</A>;';
// TypeScript: A (open tag), b (attribute), text over two lines, A (close)
const typeScriptSpans = [5, 1, 19, 7, 1, 22, 13, 6, 23, 21, 1, 20];
// line delta, column delta, length, type (0 tag, 1 component, 2 attribute,
// 3 text), modifiers
const tokens = [
  ...[0, 5, 1, 1, 0],
  ...[0, 2, 1, 2, 0],
  ...[1, 0, 4, 3, 0],
  ...[1, 2, 1, 1, 0],
];

test('JSX colors come at once, one semantic token per line', async () => {
  const model = fakeModel(code, '/1/a.tsx');
  const { provider: p, asked } = provider(typeScriptSpans);
  expect(hasJsxColors(model)).toBe(false);
  const { data } = p.provideDocumentSemanticTokens(model);
  expect([...data]).toEqual(tokens);
  expect(hasJsxColors(model)).toBe(true);
  // TypeScript agrees
  await settle();
  expect(asked.again).toBe(0);
});

test("TypeScript's reading repaints where it differs", async () => {
  const model = fakeModel(code, '/1/a.tsx');
  // TypeScript reads `b` as text
  const { provider: p, asked } = provider([5, 1, 19, 7, 1, 23]);
  expect([...p.provideDocumentSemanticTokens(model).data]).toEqual(tokens);
  await settle();
  expect(asked.again).toBe(1);
  expect([...p.provideDocumentSemanticTokens(model).data]).toEqual([
    ...[0, 5, 1, 1, 0],
    ...[0, 2, 1, 3, 0],
  ]);
  await settle();
  expect(asked.again).toBe(1);
});

test('models that get no JSX colors have none to wait for', () => {
  expect(hasJsxColors(fakeModel('<T>x', '/1/a.ts'))).toBe(true);
  // a js fence titled App.tsx
  expect(hasJsxColors(fakeModel('<a />', '/1/App.tsx', 'javascript'))).toBe(
    true,
  );
});
