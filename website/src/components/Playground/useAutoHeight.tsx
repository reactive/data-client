import { type MonacoDiffEditor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAutoHeight({
  isFocused = false,
  lineHeight,
  containerGutter = 10,
}) {
  const updateHeightRef = useRef<() => void>();
  useEffect(() => {
    if (isFocused && updateHeightRef.current) {
      setTimeout(updateHeightRef.current, 5);
    }
  }, [isFocused]);

  const [height, setHeight] = useState<string | number>('1000');
  const handleMount = useCallback(
    (
      editor: Monaco.editor.ICodeEditor | MonacoDiffEditor,
      monaco: typeof Monaco,
    ) => {
      // autoheight
      const LINE_HEIGHT = lineHeight;
      const CONTAINER_GUTTER = containerGutter;

      const el = editor.getContainerDomNode();
      const codeContainers = el.getElementsByClassName('view-lines');

      let prevLineCount = 0;

      const model = editor.getModel();
      let lineCount = 10;
      if (model) {
        // before rendering we have no view information, so we initialize based on unwrapped lines
        lineCount = getLineCount(model);
      }

      const contentHeight = lineCount * LINE_HEIGHT + CONTAINER_GUTTER;
      el.style.height = contentHeight + 'px';
      setHeight(contentHeight);

      editor.layout();

      updateHeightRef.current = () => {
        // For diff editors, take max of both sides' line counts
        const codeContainerCount = Math.max(
          ...Array.from(codeContainers).map(c => c.childElementCount),
        );
        const viewlinecount =
          editor._modelData?.viewModel?.getLineCount?.() ?? codeContainerCount;
        const model = editor.getModel();
        const modellinecount = model ? getLineCount(model) : codeContainerCount;
        const lineCount =
          viewlinecount < modellinecount * 3 ? viewlinecount : modellinecount;
        const height = lineCount * LINE_HEIGHT + CONTAINER_GUTTER; // fold
        prevLineCount = codeContainerCount;

        el.style.height = height + 'px';
        setHeight(height);

        editor.layout();
      };
      if ('onDidChangeModelDecorations' in editor) {
        editor.onDidChangeModelDecorations(() => {
          // wait until dom rendered
          setTimeout(updateHeightRef.current, 0);
        });
      } else {
        editor.getOriginalEditor().onDidChangeModelDecorations(() => {
          // wait until dom rendered
          setTimeout(updateHeightRef.current, 0);
        });
        editor.getModifiedEditor().onDidChangeModelDecorations(() => {
          // wait until dom rendered
          setTimeout(updateHeightRef.current, 0);
        });
      }
      return () => editor?.dispose();
    },
    [],
  );
  return { height, handleMount };
}

function getLineCount(
  model: Monaco.editor.ITextModel | Monaco.editor.IDiffEditorModel,
) {
  if ('original' in model) {
    return Math.max(
      model.original.getLineCount(),
      model.modified.getLineCount(),
    );
  }
  return model.getLineCount();
}
