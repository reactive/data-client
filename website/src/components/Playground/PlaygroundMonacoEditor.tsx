import Editor, { type OnMount } from '@monaco-editor/react';
import type { ISelection } from 'monaco-editor';
import rangeParser from 'parse-numeric-range';
import React, { memo, useCallback, useState } from 'react';
import { LiveEditor } from 'react-live';
import './monaco-init';
import type * as Monaco from 'monaco-editor';

const MemoEditor = memo(Editor);

export default function PlaygroundMonacoEditor({
  onChange,
  code,
  path,
  onFocus,
  tabIndex,
  highlights,
  autoFocus = false,
  large = false,
  ...rest
}) {
  const editorOptions = large ? largeOptions : options;

  //const isBrowser = useIsBrowser(); we used to key Editor on this; but I'm not sure why

  if (!path.endsWith('.tsx') && !path.endsWith('.ts')) {
    path = path + '.tsx';
  }
  /* TODO: using ts to compile rather than babel
  const handleChange = useWorkerCB(
    tsWorker => {
      tsWorker.getEmitOutput(`file:///${path}`).then(source => {
        onChange(source.outputFiles[0].text);
      });
    },
    [onChange, path],
  );*/
  const [height, setHeight] = useState<string | number>('500');
  const handleMount = useCallback(
    (editor: Monaco.editor.ICodeEditor, monaco: typeof Monaco) => {
      // autofocus
      if (autoFocus) editor.focus();
      // autohighlight
      const myhighlights = highlights && rangeParser(highlights);

      if (highlights) {
        let selectionStartLineNumber = myhighlights[0];
        let positionLineNumber = selectionStartLineNumber;
        const selections: ISelection[] = [];
        myhighlights.forEach(lineNumber => {
          // more of same selection
          if (lineNumber === positionLineNumber) {
            positionLineNumber++;
          } else {
            selections.push({
              selectionStartLineNumber,
              selectionStartColumn: 0,
              positionLineNumber,
              positionColumn: 0,
            });
            selectionStartLineNumber = lineNumber;
            positionLineNumber = lineNumber + 1;
          }
        });
        selections.push({
          selectionStartLineNumber,
          selectionStartColumn: 0,
          positionLineNumber,
          positionColumn: 0,
        });
        editor.setSelections(selections);
      }

      // go to definition
      editor.onDidFocusEditorText(() => {
        onFocus(tabIndex);
      });

      // autoheight
      const LINE_HEIGHT = editorOptions.lineHeight;
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
          const lineCount =
            editor.getModel()?.getLineCount?.() ??
            codeContainer.childElementCount;
          const height = lineCount * LINE_HEIGHT + CONTAINER_GUTTER; // fold
          prevLineCount = codeContainer.childElementCount;

          el.style.height = height + 'px';
          setHeight(height);

          editor.layout();
        }, 0);
      });
      return () => editor?.dispose();
    },
    [],
  );

  return (
    <MemoEditor
      path={path}
      defaultLanguage="typescript"
      onChange={onChange}
      defaultValue={code}
      //value={code}
      options={editorOptions}
      theme="prism"
      onMount={handleMount}
      height={height}
      loading={<LiveEditor language="tsx" code={code} disabled />}
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
  fontLigatures: true,
  fontFamily:
    '"Roboto Mono",SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
  fontSize: 13,
  lineHeight: 19,
} as const;

const largeOptions = {
  ...options,
  fontSize: 14,
  lineHeight: 20,
};

/*function useMonacoWorker(
  callback: (worker: languages.typescript.TypeScriptWorker) => void,
): MutableRefObject<languages.typescript.TypeScriptWorker | undefined> {
  const monaco = useMonaco();
  const workerRef = useRef<languages.typescript.TypeScriptWorker | undefined>();
  useEffect(() => {
    if (!monaco) return;
    monaco.languages.typescript
      .getTypeScriptWorker()
      .then(a => a())
      .then(worker => {
        workerRef.current = worker;
        //callback(worker);
      });
  }, [monaco]);
  return workerRef;
}

function useWorkerCB(
  callback: (worker: languages.typescript.TypeScriptWorker) => void,
  deps: any[],
) {
  const tsWorkerRef = useMonacoWorker(callback);

  return useCallback((...args) => {
    if (!tsWorkerRef.current) return;
    callback(tsWorkerRef.current);
  }, deps);
}
*/
