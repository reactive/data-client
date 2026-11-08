import type * as Monaco from 'monaco-editor';

import { isComponentName, JSX_ATTRIBUTE, JSX_TEXT } from './spans';

/**
 * JSX colors for Monaco (see ./README.md). Monaco's TypeScript grammar doesn't
 * know JSX, so Monaco paints tag names, attribute names and text over the
 * grammar's colors as semantic tokens. They come at once from a quick reading
 * of the code. TypeScript itself then checks them in its worker
 * (./worker.js), where they would otherwise wait behind every editor's type
 * check, and repaints them where it reads the code otherwise.
 */

/** A file's JSX spans (./spans.ts) */
export type ReadJsx = (code: string) => number[];

/** Semantic token types, by index */
const TYPES = ['jsxTag', 'jsxComponent', 'jsxAttribute', 'jsxText'];

interface JsxWorker {
  getJsxSpans(fileName: string): Promise<number[]>;
}

/** Each model's latest tokens: readJsx's, until TypeScript's replace them */
const latest = new WeakMap<
  Monaco.editor.ITextModel,
  { version: number; data: number[] }
>();

/** Whether `model` shows its JSX colors, or has none to wait for */
export const hasJsxColors = (model: Monaco.editor.ITextModel) =>
  !takesJsx(model) || latest.get(model)?.version === model.getVersionId();

/** TypeScript parses JSX only in .tsx files, and the provider never sees
 * other languages' models, so a js fence titled App.tsx has no JSX colors */
const takesJsx = (model: Monaco.editor.ITextModel) =>
  model.uri.path.endsWith('.tsx') && model.getLanguageId() === 'typescript';

/** Paints JSX in Monaco's typescript models, from `readJsx` at once and then
 * from TypeScript */
export function registerJsxColors(monaco: typeof Monaco, readJsx: ReadJsx) {
  const recheck = new monaco.Emitter<void>();

  /** Repaints `model` if TypeScript reads its JSX unlike `data` */
  const check = async (
    model: Monaco.editor.ITextModel,
    version: number,
    data: number[],
  ) => {
    const getWorker = await monaco.typescript.getTypeScriptWorker();
    const worker = (await getWorker(model.uri)) as unknown as JsxWorker;
    const stale = () => model.isDisposed() || model.getVersionId() !== version;
    if (stale()) return;
    const spans = await worker.getJsxSpans(model.uri.toString());
    if (stale()) return;
    const exact = encode(model, spans);
    latest.set(model, { version, data: exact });
    // Monaco asks again for every model, and gets each one's latest
    if (exact.join() !== data.join()) recheck.fire();
  };

  monaco.languages.registerDocumentSemanticTokensProvider('typescript', {
    onDidChange: recheck.event,
    getLegend: () => ({ tokenTypes: TYPES, tokenModifiers: [] }),
    provideDocumentSemanticTokens(model) {
      if (!takesJsx(model)) return { data: new Uint32Array() };
      const version = model.getVersionId();
      let known = latest.get(model);
      if (known?.version !== version) {
        known = { version, data: encode(model, readJsx(model.getValue())) };
        latest.set(model, known);
        // if TypeScript can't check, readJsx's colors stay
        check(model, version, known.data).catch(() => undefined);
      }
      return { data: new Uint32Array(known.data) };
    },
    releaseDocumentSemanticTokens() {},
  });
}

/**
 * `spans` (start, length, kind) as Monaco's semantic tokens: one per line,
 * each relative to the one before
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
      spans[i + 2] === JSX_TEXT ? 'jsxText'
      : spans[i + 2] === JSX_ATTRIBUTE ? 'jsxAttribute'
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
