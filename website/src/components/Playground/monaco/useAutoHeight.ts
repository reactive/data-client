import { type MonacoDiffEditor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';

function isDiffEditor(
  editor: Monaco.editor.ICodeEditor | MonacoDiffEditor,
): editor is MonacoDiffEditor {
  return 'getOriginalEditor' in editor && 'getModifiedEditor' in editor;
}

/**
 * The editor's height, fit to its content as it lays out: give it to
 * @monaco-editor/react's `height` and call `handleMount` from `onMount`. It
 * also lays the editor out as its box resizes (see layoutWhileShown).
 */
export default function useAutoHeight({
  initialContentHeight,
  // DiffEditor's first paint leaves the same space (--diff-gutter)
  containerGutter = 10,
}: {
  /** Estimate (line count × line height) shown until Monaco measures itself */
  initialContentHeight: number;
  containerGutter?: number;
}) {
  const [height, setHeight] = useState(initialContentHeight + containerGutter);

  const disposablesRef = useRef<{ dispose(): void }[]>([]);
  useEffect(() => () => disposablesRef.current.forEach(d => d.dispose()), []);

  const handleMount = useCallback(
    (editor: Monaco.editor.ICodeEditor | MonacoDiffEditor) => {
      const editors =
        isDiffEditor(editor) ?
          [editor.getOriginalEditor(), editor.getModifiedEditor()]
        : [editor];
      // modified (or sole) editor is the one users interact with
      const primary = editors[editors.length - 1];

      const updateHeight = () => {
        if (!hasLayoutWidth(primary)) return;

        setHeight(
          Math.max(...editors.map(e => e.getContentHeight())) + containerGutter,
        );
      };

      updateHeight();

      disposablesRef.current.forEach(d => d.dispose());
      disposablesRef.current = [
        ...editors.map(e => e.onDidContentSizeChange(updateHeight)),
        layoutWhileShown(editor),
      ];
    },
    [containerGutter],
  );

  return { height, handleMount };
}

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
 * Monaco's `automaticLayout`, except that a hidden or crushed box (see
 * MIN_LAYOUT_WIDTH) leaves the editor as it was. Laid out at no width, word
 * wrap would break every line into one-letter rows, and showing the box
 * again would lay it all out anew, drawing a frame of that; kept, the editor
 * shows again as it was. Lays out as the box resizes, before that frame
 * paints. Returns the stop.
 */
function layoutWhileShown(
  editor: Monaco.editor.ICodeEditor | MonacoDiffEditor,
): Monaco.IDisposable {
  let last = { width: -1, height: -1 };
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width < MIN_LAYOUT_WIDTH) return;
    if (width === last.width && height === last.height) return;
    last = { width, height };
    editor.layout(last);
  });
  observer.observe(editor.getContainerDomNode());
  return { dispose: () => observer.disconnect() };
}
