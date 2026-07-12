import BrowserOnly from '@docusaurus/BrowserOnly';
import { DiffEditor as BaseDiffEditor } from '@monaco-editor/react';
import clsx from 'clsx';
import { type editor } from 'monaco-editor';
import { useMemo } from 'react';

import type { CodeDocument } from './Playground/editor/codeModel';
import { extensionToMonacoLanguage } from './Playground/extensionToMonacoLanguage';
import './Playground/monaco-init';
import { isMobileOrBot } from './Playground/isMobileOrBot';
import { options } from './Playground/monacoOptions';
import MonacoPreloads from './Playground/MonacoPreloads';
import styles from './Playground/styles.module.css';
import useAutoHeight from './Playground/useAutoHeight';

export default function DiffEditor({ documents, fallback }: DiffMonacoProps) {
  const [original, modified] = useMemo(
    () => documents.map(({ value }) => value.replaceAll(HIGHLIGHT_COMMENT, '')),
    [documents],
  );

  const { height, handleMount } = useAutoHeight({
    initialContentHeight:
      Math.max(original.split('\n').length, modified.split('\n').length) *
      options.lineHeight,
  });

  return (
    <>
      <BrowserOnly fallback={fallback}>
        {() => {
          // Skip Monaco for mobile/bots - use static fallback
          if (isMobileOrBot()) {
            return fallback;
          }
          return (
            <div className={styles.playgroundQueryContainer}>
              <div
                className={clsx(
                  styles.playgroundContainer,
                  styles.standaloneEditor,
                )}
              >
                <div className={styles.playgroundTextEdit}>
                  <div className={styles.playgroundEditor}>
                    <BaseDiffEditor
                      language={extensionToMonacoLanguage(
                        documents[0].language,
                      )}
                      original={original}
                      modified={modified}
                      options={DIFF_OPTIONS}
                      onMount={handleMount}
                      height={height}
                      theme="prism"
                      loading={fallback}
                      // Prevent "TextModel got disposed before DiffEditorWidget model got reset" error
                      // by not letting @monaco-editor/react manage model disposal
                      keepCurrentOriginalModel
                      keepCurrentModifiedModel
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </BrowserOnly>
      <MonacoPreloads />
    </>
  );
}

export type DiffMonacoProps = {
  fallback: React.ReactNode;
  documents: readonly CodeDocument[];
};

const HIGHLIGHT_COMMENT = /^\s*\/\/ highlight-(next-line|start|end)\n/gm;

const DIFF_OPTIONS: editor.IDiffEditorConstructionOptions = {
  ...options,
  renderSideBySide: true,
  renderOverviewRuler: false,
  renderGutterMenu: false,
  renderMarginRevertIcon: false,
  renderIndicators: false,
  useInlineViewWhenSpaceIsLimited: false,
  enableSplitViewResizing: false,
  readOnly: true,
  compactMode: true,
};
