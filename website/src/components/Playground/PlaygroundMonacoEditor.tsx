import Editor from '@monaco-editor/react';
import type { ISelection } from 'monaco-editor';
import type * as Monaco from 'monaco-editor';
import rangeParser from 'parse-numeric-range';
import { useCallback, useMemo } from 'react';
import { LiveEditor } from 'react-live';
import './monaco-init';

import { extensionToMonacoLanguage } from './extensionToMonacoLanguage';
import { largeOptions, options } from './monacoOptions';
import useAutoHeight from './useAutoHeight';

export default function PlaygroundMonacoEditor({
  onChange,
  code,
  path = '',
  onFocus,
  tabIndex,
  highlights = undefined,
  autoFocus = false,
  large = false,
  isFocused = false,
  language = 'tsx',
  readOnly = false,
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
