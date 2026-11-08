import type * as Monaco from 'monaco-editor';

import { hasJsxColors } from './jsxTokens';
import { hasLayoutWidth } from './layout';
import { holdIdle } from './whenIdle';

/**
 * Calls `done` once `editor` shows its code as it will stay: laid out at its
 * box's width and highlighted (its language's tokenizer can load after it,
 * and JSX colors come as semantic tokens just after that).
 * Checked each frame; Monaco paints in a frame of its own, so it counts once
 * true for two in a row; regardless once colored tokens have shown for
 * `MAX_MS` (code its tokenizer leaves plain) or none have for `NO_TOKENS_MS`
 * after layout (no tokenizer). A tokenizer loads on demand, so on a slow
 * machine its tokens can come long after the layout. One mounted hidden has
 * no width and waits, at no cost, until shown; one hidden later keeps its
 * last width (./layout) and goes on. While it is laid out and not yet
 * painted, deferred work (whenIdle) waits. Returns a cancel.
 */
export function whenPainted(
  editor: Monaco.editor.ICodeEditor,
  done: () => void,
): () => void {
  let laidOutAt: number | undefined;
  let coloredAt: number | undefined;
  let streak = 0;
  let frame = 0;
  let release: (() => void) | undefined;
  const hold = () => {
    release ??= holdIdle();
  };
  const check = () => {
    frame = 0;
    if (!hasLayoutWidth(editor)) return;
    hold();
    const now = performance.now();
    laidOutAt ??= now;
    if (coloredAt === undefined && editor.getDomNode()?.querySelector(COLORED))
      coloredAt = now;
    streak = painted(editor) ? streak + 1 : 0;
    const timedOut =
      coloredAt === undefined ?
        now - laidOutAt > NO_TOKENS_MS
      : now - coloredAt > MAX_MS;
    if (streak === 2 || timedOut) finish();
    else frame = requestAnimationFrame(check);
  };
  const resume = () => {
    if (!frame) frame = requestAnimationFrame(check);
  };
  const layout = editor.onDidLayoutChange(resume);
  // from now, not the first frame: deferred work could start before it
  if (hasLayoutWidth(editor)) hold();
  resume();
  const stop = () => {
    cancelAnimationFrame(frame);
    layout.dispose();
    release?.();
  };
  function finish() {
    stop();
    done();
  }
  return stop;
}
const MAX_MS = 6000;
const NO_TOKENS_MS = 20000;
/** a token in any color but plain text's */
const COLORED = '[class^="mtk"]:not(.mtk1)';

function painted(editor: Monaco.editor.ICodeEditor) {
  const model = editor.getModel();
  // nothing to highlight (an empty side of a diff)
  if (!model?.getValue().trim()) return true;
  // JSX colors come as semantic tokens, just after the grammar's
  if (!hasJsxColors(model)) return false;
  // Monaco highlights from the top down, drawing the lines it has yet to
  // reach in plain text: once the last line with text is COLORED, all are
  let last: Element | undefined;
  let lastTop = -Infinity;
  for (const line of editor
    .getDomNode()
    ?.querySelectorAll<HTMLElement>('.view-line') ?? []) {
    const top = parseFloat(line.style.top);
    if (top > lastTop && line.textContent?.trim()) {
      last = line;
      lastTop = top;
    }
  }
  return !!last?.querySelector(COLORED);
}
