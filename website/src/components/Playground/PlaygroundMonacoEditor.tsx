import Editor from '@monaco-editor/react';
import type { ISelection } from 'monaco-editor';
import type * as Monaco from 'monaco-editor';
import rangeParser from 'parse-numeric-range';
import { useCallback, useMemo } from 'react';
import { LiveEditor } from 'react-live';
import './monaco-init';

import { extensionToMonacoLanguage } from './extensionToMonacoLanguage';
import useAutoHeight from './useAutoHeight';

export default function PlaygroundMonacoEditor({
  onChange,
  code,
  path = '',
  onFocus,
  tabIndex,
  highlights,
  autoFocus = false,
  large = false,
  isFocused = false,
  language = 'tsx',
  original,
  readOnly,
  ...rest
}) {
  const editorOptions = useMemo(
    () => ({ ...(large ? largeOptions : options), readOnly }),
    [large, readOnly],
  );
  //const isBrowser = useIsBrowser(); we used to key Editor on this; but I'm not sure why

  /* TODO: using ts to compile rather than babel
  const handleChange = useWorkerCB(
    tsWorker => {
      tsWorker.getEmitOutput(`file:///${path}`).then(source => {
        onChange(source.outputFiles[0].text);
      });
    },
    [onChange, path],
  );*/
  const { height, handleMount: handleAutoMount } = useAutoHeight({
    isFocused,
    lineHeight: editorOptions.lineHeight,
  });
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

      return handleAutoMount(editor, monaco);
    },
    [],
  );

  return (
    <Editor
      path={path}
      defaultLanguage={extensionToMonacoLanguage(language)}
      onChange={onChange}
      defaultValue={code}
      //value={code}
      options={editorOptions}
      theme="prism"
      onMount={handleMount}
      height={height}
      loading={<LiveEditor language={language} code={code} disabled />}
    />
  );
}

export const options = {
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
