import type * as Monaco from 'monaco-editor';

import { hasLayoutWidth } from './useAutoHeight';

/**
 * Calls `done` once `editor` shows its code as it will stay: laid out at its
 * box's width (a hidden tab has none; it waits, at no cost, until shown) and
 * highlighted (its language's tokenizer can load after it). Checked each
 * frame; Monaco paints in a frame of its own, so it counts once true for two
 * in a row. Also called when the editor gains focus, and regardless once
 * colored tokens have shown for `MAX_MS` (code its tokenizer leaves plain)
 * or none have shown for `NO_TOKENS_MS` after layout (no tokenizer). A
 * tokenizer loads on demand, so on a slow machine its tokens can come long
 * after the layout. Returns a cancel.
 */
export function whenPainted(
  editor: Monaco.editor.ICodeEditor,
  done: () => void,
): () => void {
  let laidOutAt: number | undefined;
  let coloredAt: number | undefined;
  let streak = 0;
  let frame = 0;
  const check = () => {
    frame = 0;
    if (!hasLayoutWidth(editor)) return;
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
  const subscriptions = [
    editor.onDidLayoutChange(resume),
    editor.onDidFocusEditorText(() => finish()),
  ];
  resume();
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const subscription of subscriptions) subscription.dispose();
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
  // nothing to highlight (an empty side of a diff)
  if (!editor.getModel()?.getValue().trim()) return true;
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
