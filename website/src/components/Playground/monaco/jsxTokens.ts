import type * as Monaco from 'monaco-editor';

import { isComponentName, isTypeScript } from './language';
import { JSX_ATTRIBUTE, JSX_TAG, JSX_TEXT, jsxSpans } from './tokenize';

/**
 * JSX colors. Monaco's TypeScript grammar doesn't know JSX, so Monaco paints
 * tag names, attribute names and text over the grammar's colors as semantic
 * tokens. They come at once from ./tokenize.ts's reading, the one that colors
 * the server's copy. TypeScript itself then checks them, in the playground's
 * worker (./surfaceWorker.js), where they would otherwise wait behind every
 * editor's type check, and repaints them where it reads the code otherwise.
 * ./theme.ts colors these token types.
 */

/** Semantic token types, by index */
const TYPES = ['jsxTag', 'jsxComponent', 'jsxAttribute', 'jsxText'];

/** TypeScript's ClassificationType values, as `jsxSpans()` kinds */
const FROM_TYPESCRIPT: Record<number, number> = {
  // tag names: open, close, self-closing
  19: JSX_TAG,
  20: JSX_TAG,
  21: JSX_TAG,
  22: JSX_ATTRIBUTE,
  23: JSX_TEXT,
};

interface JsxWorker {
  getJsxSpans(fileName: string): Promise<number[]>;
}

/** Each model's version whose JSX colors were last handed to Monaco */
const painted = new WeakMap<Monaco.editor.ITextModel, number>();
/** Each model's version TypeScript is checking, or has checked: its tokens */
const checked = new WeakMap<
  Monaco.editor.ITextModel,
  { version: number; data?: number[] }
>();

/** Whether `model` shows its JSX colors, or has none to wait for */
export const hasJsxColors = (model: Monaco.editor.ITextModel) =>
  !takesJsx(model) || painted.get(model) === model.getVersionId();

/** TypeScript parses JSX only in .tsx files, and the provider never sees
 * other languages' models, so a js fence titled App.tsx has no JSX colors */
const takesJsx = (model: Monaco.editor.ITextModel) =>
  model.uri.path.endsWith('.tsx') && isTypeScript(model);

export function registerJsxColors(monaco: typeof Monaco) {
  const recheck = new monaco.Emitter<void>();

  /** Repaints `model` if TypeScript reads its JSX unlike `data` */
  const check = async (
    model: Monaco.editor.ITextModel,
    version: number,
    data: number[],
  ) => {
    checked.set(model, { version });
    const getWorker = await monaco.typescript.getTypeScriptWorker();
    const worker = (await getWorker(model.uri)) as unknown as JsxWorker;
    const spans = await worker.getJsxSpans(model.uri.toString());
    if (model.isDisposed() || model.getVersionId() !== version) return;
    for (let i = 2; i < spans.length; i += 3)
      spans[i] = FROM_TYPESCRIPT[spans[i]];
    const exact = encode(model, spans);
    checked.set(model, { version, data: exact });
    if (exact.join() !== data.join()) recheck.fire();
  };

  monaco.languages.registerDocumentSemanticTokensProvider('typescript', {
    onDidChange: recheck.event,
    getLegend: () => ({ tokenTypes: TYPES, tokenModifiers: [] }),
    provideDocumentSemanticTokens(model) {
      if (!takesJsx(model)) return { data: new Uint32Array() };
      const version = model.getVersionId();
      const known = checked.get(model);
      const data =
        (known?.version === version && known.data) ||
        encode(model, jsxSpans(model.getValue()));
      // if TypeScript can't check, tokenize.ts's colors stay
      if (known?.version !== version)
        check(model, version, data).catch(() => undefined);
      painted.set(model, version);
      return { data: new Uint32Array(data) };
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
