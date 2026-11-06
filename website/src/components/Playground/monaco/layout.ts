import type { MonacoDiffEditor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

/** Narrower than this, a box isn't really shown: hidden (display:none)
 * reports 0, and a crushed pane during flex transitions nearly as little,
 * where word-wrap invents thousands of lines */
const MIN_LAYOUT_WIDTH = 40;

/** Whether `editor` was last laid out at a real width (see MIN_LAYOUT_WIDTH):
 * one mounted hidden starts at none */
export function hasLayoutWidth(editor: Monaco.editor.ICodeEditor) {
  return editor.getLayoutInfo().width >= MIN_LAYOUT_WIDTH;
}

/**
 * Monaco's `automaticLayout` (off in ./options), except that a hidden or
 * crushed box (see MIN_LAYOUT_WIDTH) leaves the editor as it was. Laid out
 * at no width, word wrap would break every line into one-letter rows, and
 * showing the box again would lay it all out anew, drawing a frame of that;
 * kept, the editor shows again as it was. Lays out as the box resizes,
 * before that frame paints. Every Monaco host attaches it at mount
 * (useAutoHeight does). Returns the stop.
 */
export function layoutWhileShown(
  editor: Monaco.editor.ICodeEditor | MonacoDiffEditor,
): Monaco.IDisposable {
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width >= MIN_LAYOUT_WIDTH) editor.layout({ width, height });
  });
  observer.observe(editor.getContainerDomNode());
  return { dispose: () => observer.disconnect() };
}
