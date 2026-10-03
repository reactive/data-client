import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import rangeParser from 'parse-numeric-range';
import { memo, useCallback, useMemo } from 'react';
import { LiveEditor } from 'react-live';

import '../monaco/setup';
import { highlightSelections } from '../monaco/highlightSelections';
import { extensionToMonacoLanguage } from '../monaco/language';
import { options } from '../monaco/options';
import { MONACO_THEME } from '../monaco/theme';
import useAutoHeight from '../monaco/useAutoHeight';
import { isMobileOrBot } from '../userAgent';
import StaticEditor from './StaticEditor';

// TODO: consider using the ts worker's getEmitOutput to compile rather than babel

const MobileEditor = memo(LiveEditor);

export interface InteractiveEditorProps {
  onChange: (value: string | undefined) => void;
  code: string;
  /** Monaco model path (see ../monaco/modelPath.ts) */
  path?: string;
  /** Called with tabIndex whenever this editor gains focus */
  onFocus: (tabIndex: number) => void;
  tabIndex: number;
  /** Code-fence line ranges to pre-select, e.g. `1-3,5` */
  highlights?: string;
  autoFocus?: boolean;
  /** Whether this tab is visible; re-measures height when it becomes so */
  isFocused?: boolean;
  language?: string;
}

/**
 * Client-only (render inside BrowserOnly): Monaco on desktop, an editable
 * react-live editor on mobile/bots.
 */
function InteractiveEditor({
  onChange,
  code,
  path = '',
  onFocus,
  tabIndex,
  highlights,
  autoFocus = false,
  isFocused = false,
  language = 'tsx',
}: InteractiveEditorProps) {
  const { height, handleMount: handleAutoMount } = useAutoHeight({
    initialContentHeight: code.split('\n').length * options.lineHeight,
    isFocused,
  });

  // Mount-time setup only: props read here are fixed for the editor's life
  const handleMount = useCallback((editor: Monaco.editor.ICodeEditor) => {
    if (autoFocus) editor.focus();
    if (highlights) {
      const selections = highlightSelections(rangeParser(highlights));
      if (selections.length) editor.setSelections(selections);
    }
    // Focus reveals this tab (also how cross-tab go to definition lands)
    editor.onDidFocusEditorText(() => {
      onFocus(tabIndex);
    });
    handleAutoMount(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // loading only shows the initial snapshot, so it need not track code changes
  const loading = useMemo(
    () => <StaticEditor language={language} code={code} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  // After hooks to satisfy the rules of hooks; safe because we only render
  // client-side, so navigator is defined and hydration is already done.
  if (isMobileOrBot()) {
    return <MobileEditor onChange={onChange} code={code} />;
  }

  return (
    <Editor
      path={path}
      defaultLanguage={extensionToMonacoLanguage(language)}
      onChange={onChange}
      defaultValue={code}
      options={options}
      theme={MONACO_THEME}
      onMount={handleMount}
      height={height}
      loading={loading}
    />
  );
}
export default memo(InteractiveEditor);
