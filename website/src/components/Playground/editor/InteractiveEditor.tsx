import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import rangeParser from 'parse-numeric-range';
import { memo, useCallback, useMemo } from 'react';

import '../monaco/setup';
import { highlightSelections } from '../monaco/highlightSelections';
import { extensionToMonacoLanguage } from '../monaco/language';
import { options } from '../monaco/options';
import { MONACO_THEME } from '../monaco/theme';
import useAutoHeight from '../monaco/useAutoHeight';
import useDefinitionOpener from '../monaco/useDefinitionOpener';
import useEditorCover from '../monaco/useEditorCover';
import useOverflowWidgets from '../monaco/useOverflowWidgets';
import PlaygroundLiveEditor from '../PlaygroundLiveEditor';
import styles from '../styles.module.css';
import { isMobileOrBot } from '../userAgent';
import type { CodeTarget } from './openCode';
import StaticEditor from './StaticEditor';

// TODO: consider using the ts worker's getEmitOutput to compile rather than babel

export interface InteractiveEditorProps {
  onChange: (value: string | undefined) => void;
  code: string;
  /** Monaco model path (see ../monaco/modelPath.ts) */
  path?: string;
  /** Runs when this editor mounts, after Monaco loads and before it creates its model. Only the first render's value is used. */
  beforeMount?: (monaco: typeof Monaco) => void;
  /** Called with tabIndex whenever this editor gains focus */
  onFocus: (tabIndex: number) => void;
  tabIndex: number;
  /** Code-fence line ranges to pre-select, e.g. `1-3,5` */
  highlights?: string;
  autoFocus?: boolean;
  /** Whether this tab is visible; re-measures height when it becomes so */
  isFocused?: boolean;
  language: string;
  readOnly?: boolean;
  /** A line to put the cursor on (each new object, once) */
  reveal?: Pick<CodeTarget, 'line'>;
}

/**
 * Client-only (render inside BrowserOnly): Monaco on desktop, an editable
 * react-live editor on mobile/bots.
 */
function InteractiveEditor({
  onChange,
  code,
  path = '',
  beforeMount,
  onFocus,
  tabIndex,
  highlights,
  autoFocus = false,
  isFocused = false,
  language,
  readOnly = false,
  reveal,
}: InteractiveEditorProps) {
  const overflowWidgets = useOverflowWidgets();
  const editorOptions = useMemo(
    () => ({ ...options, ...overflowWidgets.options, readOnly }),
    [overflowWidgets.options, readOnly],
  );
  const { height, handleMount: handleAutoMount } = useAutoHeight({
    initialContentHeight: code.split('\n').length * editorOptions.lineHeight,
    isFocused,
  });
  const { covered, coverRef, cover } = useEditorCover();
  const handleOpenerMount = useDefinitionOpener({
    isVisible: isFocused,
    onOpen: () => onFocus(tabIndex),
    reveal,
  });

  // Mount-time setup only: props read here are fixed for the editor's life
  const handleMount = useCallback(
    (editor: Monaco.editor.ICodeEditor, monaco: typeof Monaco) => {
      if (autoFocus) editor.focus();
      if (highlights) {
        const selections = highlightSelections(rangeParser(highlights));
        if (selections.length) editor.setSelections(selections);
      }
      // Focus reveals this tab
      editor.onDidFocusEditorText(() => {
        onFocus(tabIndex);
      });
      handleAutoMount(editor);
      handleOpenerMount(editor, monaco);
      overflowWidgets.handleMount(editor);
      cover([editor]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // the cover shows only the initial snapshot; need not track code
  const staticCode = useMemo(
    () => <StaticEditor language={language} code={code} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  // After hooks to satisfy the rules of hooks; safe because we only render
  // client-side, so navigator is defined and hydration is already done.
  if (isMobileOrBot()) {
    return (
      <PlaygroundLiveEditor
        onChange={onChange}
        code={code}
        language={language}
      />
    );
  }

  // the cover: the code as the page first drew it (styles.module.css)
  return (
    <div className={styles.editorHost}>
      <Editor
        path={path}
        beforeMount={beforeMount}
        defaultLanguage={extensionToMonacoLanguage(language)}
        onChange={onChange}
        defaultValue={code}
        options={editorOptions}
        theme={MONACO_THEME}
        onMount={handleMount}
        height={height}
        loading={null}
      />
      {covered ?
        <div ref={coverRef} className={styles.editorCover}>
          {staticCode}
        </div>
      : null}
    </div>
  );
}

export default memo(InteractiveEditor);
