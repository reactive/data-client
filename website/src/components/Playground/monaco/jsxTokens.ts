import type * as Monaco from 'monaco-editor';

import { isComponentName, isTypeScript } from './language';

/**
 * JSX colors. Monaco's TypeScript grammar doesn't know JSX, so TypeScript
 * itself classifies it, in the playground's worker (./surfaceWorker.js), and
 * Monaco paints the result over the grammar's colors as semantic tokens:
 * tag names, attribute names and text. ./theme.ts colors these token types,
 * and ./tokenize.ts colors the server's copy the same way.
 */

/** Semantic token types, by index */
const TYPES = ['jsxTag', 'jsxComponent', 'jsxAttribute', 'jsxText'];

/** TypeScript's ClassificationType values (19 to 21 are tag names) */
const ATTRIBUTE = 22;
const TEXT = 23;

interface JsxWorker {
  getJsxSpans(fileName: string): Promise<number[]>;
}

/** Each model's version whose JSX colors were last handed to Monaco */
const painted = new WeakMap<Monaco.editor.ITextModel, number>();

/** Whether `model` shows its JSX colors, or has none to wait for */
export const hasJsxColors = (model: Monaco.editor.ITextModel) =>
  !takesJsx(model) || painted.get(model) === model.getVersionId();

/** TypeScript parses JSX only in .tsx files, and the provider never sees
 * other languages' models, so a js fence titled App.tsx has no JSX colors */
const takesJsx = (model: Monaco.editor.ITextModel) =>
  model.uri.path.endsWith('.tsx') && isTypeScript(model);

export function registerJsxColors(monaco: typeof Monaco) {
  monaco.languages.registerDocumentSemanticTokensProvider('typescript', {
    getLegend: () => ({ tokenTypes: TYPES, tokenModifiers: [] }),
    async provideDocumentSemanticTokens(model) {
      if (!takesJsx(model)) return { data: new Uint32Array() };
      const version = model.getVersionId();
      const getWorker = await monaco.typescript.getTypeScriptWorker();
      const worker = (await getWorker(model.uri)) as unknown as JsxWorker;
      const spans = await worker.getJsxSpans(model.uri.toString());
      if (model.isDisposed() || model.getVersionId() !== version) return null;
      painted.set(model, version);
      return { data: new Uint32Array(encode(model, spans)) };
    },
    releaseDocumentSemanticTokens() {},
  });
}

/**
 * `spans` (start, length, classification) as Monaco's semantic tokens: one
 * per line, each relative to the one before
 */
function encode(model: Monaco.editor.ITextModel, spans: number[]) {
  const data: number[] = [];
  const code = model.getValue();
  let lastLine = 1;
  let lastColumn = 1;
  for (let i = 0; i < spans.length; i += 3) {
    const start = model.getPositionAt(spans[i]);
    const end = model.getPositionAt(spans[i] + spans[i + 1]);
    const type = TYPES.indexOf(
      spans[i + 2] === TEXT ? 'jsxText'
      : spans[i + 2] === ATTRIBUTE ? 'jsxAttribute'
      : isComponentName(code[spans[i]]) ? 'jsxComponent'
      : 'jsxTag',
    );
    for (let line = start.lineNumber; line <= end.lineNumber; line++) {
      const from = line === start.lineNumber ? start.column : 1;
      const to =
        line === end.lineNumber ? end.column : model.getLineMaxColumn(line);
      if (to <= from) continue;
      data.push(
        line - lastLine,
        line === lastLine ? from - lastColumn : from - 1,
        to - from,
        type,
        0,
      );
      lastLine = line;
      lastColumn = from;
    }
  }
  return data;
}
