import Editor from '@monaco-editor/react';
import type { ISelection } from 'monaco-editor';
import type * as Monaco from 'monaco-editor';
import rangeParser from 'parse-numeric-range';
import { memo, useCallback, useMemo } from 'react';
import { LiveEditor } from 'react-live';
import './monaco-init';

import { extensionToMonacoLanguage } from './extensionToMonacoLanguage';
import { isMobileOrBot } from './isMobileOrBot';
import { options } from './monacoOptions';
import PlaygroundLiveEditor from './PlaygroundLiveEditor';
import useAutoHeight from './useAutoHeight';

// TODO: consider using the ts worker's getEmitOutput to compile rather than babel

function PlaygroundMonacoEditor({
  onChange,
  code,
  path = '',
  onFocus,
  tabIndex,
  highlights,
  autoFocus = false,
  isFocused = false,
  language = 'tsx',
  readOnly = false,
}: {
  onChange: (value: string | undefined) => void;
  code: string;
  path?: string;
  onFocus: (tabIndex: number) => void;
  tabIndex: number;
  highlights?: string;
  autoFocus?: boolean;
  isFocused?: boolean;
  language?: string;
  readOnly?: boolean;
}) {
  const editorOptions = useMemo(() => ({ ...options, readOnly }), [readOnly]);
  const { height, handleMount: handleAutoMount } = useAutoHeight({
    initialContentHeight: code.split('\n').length * editorOptions.lineHeight,
    isFocused,
  });

  const handleMount = useCallback((editor: Monaco.editor.ICodeEditor) => {
    // autofocus
    if (autoFocus) editor.focus();
    // autohighlight
    const myhighlights = highlights ? rangeParser(highlights) : undefined;

    if (myhighlights) {
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

    handleAutoMount(editor);
  }, []);

  // loading only shows the initial snapshot, so it need not track code changes
  const loading = useMemo(
    () => <LiveEditor language={language} code={code} disabled />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  // Use lightweight editor for mobile/bots
  // This runs inside BrowserOnly, so navigator is always defined
  // Check must be after hooks to satisfy React's rules of hooks
  if (isMobileOrBot()) {
    return <PlaygroundLiveEditor onChange={onChange} code={code} />;
  }

  return (
    <Editor
      path={path}
      defaultLanguage={extensionToMonacoLanguage(language)}
      onChange={onChange}
      defaultValue={code}
      options={editorOptions}
      theme="prism"
      onMount={handleMount}
      height={height}
      loading={loading}
    />
  );
}
export default memo(PlaygroundMonacoEditor);
