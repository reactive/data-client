import React, { memo, useCallback, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

import './monaco-init';

const MemoEditor = memo(Editor);

export default function PlaygroundMonacoEditor({ onChange, code, path }) {
  //const isBrowser = useIsBrowser(); we used to key Editor on this; but I'm not sure why

  if (!path.endsWith('.tsx') && !path.endsWith('.ts')) {
    path = path + '.tsx';
  }
  const [height, setHeight] = useState(50);
  const handleMount: OnMount = useCallback(editor => {
    const LINE_HEIGHT = 19;
    const CONTAINER_GUTTER = 10;

    const el = editor.getDomNode();
    const codeContainer = el.getElementsByClassName('view-lines')[0];

    let prevLineCount = 0;

    const contentHeight =
      editor.getModel().getLineCount() * LINE_HEIGHT + CONTAINER_GUTTER;
    el.style.height = contentHeight + 'px';
    setHeight(contentHeight);

    editor.layout();

    editor.onDidChangeModelDecorations(() => {
      // wait until dom rendered
      setTimeout(() => {
        const height =
          codeContainer.childElementCount * LINE_HEIGHT + CONTAINER_GUTTER; // fold
        prevLineCount = codeContainer.childElementCount;

        el.style.height = height + 'px';
        setHeight(contentHeight);

        editor.layout();
      }, 0);
    });
  }, []);

  return (
    <MemoEditor
      path={path}
      defaultLanguage="typescript"
      onChange={onChange}
      value={code}
      options={options}
      theme="prism"
      onMount={handleMount}
      height={height}
    />
  );
}

const options = {
  scrollbar: { alwaysConsumeMouseWheel: false },
  minimap: { enabled: false },
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  wrappingIndent: 'indent',
  lineNumbers: 'off',
  //glyphMargin: false,
  folding: false,
  // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
  //lineDecorationsWidth: 0,
  //lineNumbersMinChars: 0,
} as const;
