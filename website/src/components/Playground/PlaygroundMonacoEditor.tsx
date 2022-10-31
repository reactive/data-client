import React, {
  memo,
  useCallback,
  useState,
  useEffect,
  useRef,
  MutableRefObject,
} from 'react';
import Editor, { useMonaco, type OnMount } from '@monaco-editor/react';
import type { languages } from 'monaco-editor';
import { LiveEditor } from 'react-live';

import './monaco-init';

const MemoEditor = memo(Editor);

export default function PlaygroundMonacoEditor({
  onChange,
  code,
  path,
  autoFocus = false,
  ...rest
}) {
  //const isBrowser = useIsBrowser(); we used to key Editor on this; but I'm not sure why

  if (!path.endsWith('.tsx') && !path.endsWith('.ts')) {
    path = path + '.tsx';
  }
  const handleChange = useWorkerCB(
    tsWorker => {
      tsWorker.getEmitOutput(`file:///${path}`).then(source => {
        onChange(source.outputFiles[0].text);
      });
    },
    [onChange, path],
  );
  const [height, setHeight] = useState<string | number>('100%');
  const handleMount: OnMount = useCallback(editor => {
    // autofocus
    if (autoFocus) editor.focus();
    // autohighlight
    const highlights = Object.keys(rest)
      .map(key => /\{(\d+)\}/.exec(key)?.[1])
      .filter(Boolean);
    if (highlights.length) {
      editor.setSelections(
        highlights.map(lineNumber => {
          const selectionStartLineNumber = Number.parseInt(lineNumber, 10);
          return {
            selectionStartLineNumber,
            selectionStartColumn: 0,
            positionLineNumber: selectionStartLineNumber + 1,
            positionColumn: 0,
          };
        }),
      );
    }

    // autoheight
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
      defaultValue={code}
      //value={code}
      options={options}
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
  fontSize: '13px',
  lineHeight: 19,
} as const;

function useMonacoWorker(
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
