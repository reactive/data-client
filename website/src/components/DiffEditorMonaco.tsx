import BrowserOnly from '@docusaurus/BrowserOnly';
import { DiffEditor as BaseDiffEditor } from '@monaco-editor/react';
import clsx from 'clsx';
import { type editor } from 'monaco-editor';
import { useMemo } from 'react';

import { extensionToMonacoLanguage } from './Playground/extensionToMonacoLanguage';
import './Playground/monaco-init';
import { isMobileOrBot } from './Playground/isMobileOrBot';
import { options } from './Playground/monacoOptions';
import MonacoPreloads from './Playground/MonacoPreloads';
import styles from './Playground/styles.module.css';
import useAutoHeight from './Playground/useAutoHeight';

export default function DiffEditor({
  codes,
  codeTabs,
  fallback,
}: DiffMonacoProps) {
  const { height, handleMount } = useAutoHeight({
    lineHeight: options.lineHeight,
  });

  const [original, modified] = useMemo(
    () => [
      codes[0].replaceAll(/^\s*\/\/ highlight-(next-line|start|end)\n/gm, ''),
      codes[1].replaceAll(/^\s*\/\/ highlight-(next-line|start|end)\n/gm, ''),
    ],
    [codes],
  );

  return (
    <>
      <BrowserOnly fallback={fallback}>
        {() => {
          // Skip Monaco for mobile/bots - use static fallback
          if (isMobileOrBot()) {
            return fallback;
          }
          return (
            <div
              className={clsx(
                styles.playgroundContainer,
                styles.standaloneEditor,
              )}
            >
              <div className={styles.playgroundTextEdit}>
                <div className={clsx(styles.playgroundEditor)}>
                  <BaseDiffEditor
                    language={extensionToMonacoLanguage(codeTabs[0].language)}
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
          );
        }}
      </BrowserOnly>
      <MonacoPreloads />
    </>
  );
}

export type DiffMonacoProps = {
  fallback: React.ReactNode;
  codes: string[];
  codeTabs: {
    [k: string]: any;
    code: string;
    path?: string | undefined;
    title?: string | undefined;
    collapsed: boolean;
  }[];
};

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
