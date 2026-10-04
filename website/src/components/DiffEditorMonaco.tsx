import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  DiffEditor as BaseDiffEditor,
  type MonacoDiffEditor,
} from '@monaco-editor/react';
import clsx from 'clsx';
import { type editor } from 'monaco-editor';
import { useCallback } from 'react';

import {
  type CalloutDocument,
  calloutMarker,
} from './Playground/editor/callouts';
import { extensionToMonacoLanguage } from './Playground/monaco/language';
import { options } from './Playground/monaco/options';
import './Playground/monaco/setup';
import { MONACO_THEME } from './Playground/monaco/theme';
import useAutoHeight from './Playground/monaco/useAutoHeight';
import styles from './Playground/styles.module.css';
import { isMobileOrBot } from './Playground/userAgent';

export default function DiffEditor({ sides, fallback }: DiffMonacoProps) {
  const original = sides[0].editorValue;
  const modified = sides[1].editorValue;

  const { height, handleMount } = useAutoHeight({
    initialContentHeight:
      Math.max(original.split('\n').length, modified.split('\n').length) *
      options.lineHeight,
  });

  // Mark each callout's line with the marker its legend entry uses. Monaco
  // doesn't render injected `after` text here, so the marker is CSS content
  // on the line's last character.
  const handleDiffMount = useCallback(
    (diffEditor: MonacoDiffEditor) => {
      handleMount(diffEditor);
      [diffEditor.getOriginalEditor(), diffEditor.getModifiedEditor()].forEach(
        (editor, i) => {
          const model = editor.getModel();
          if (!model) return;
          editor.createDecorationsCollection(
            sides[i].callouts.map(({ line, index }) => {
              const column = model.getLineMaxColumn(line);
              return {
                range: {
                  startLineNumber: line,
                  startColumn: column - 1,
                  endLineNumber: line,
                  endColumn: column,
                },
                options: { inlineClassName: `diff-callout-${index}` },
              };
            }),
          );
        },
      );
    },
    [handleMount, sides],
  );
  const markerStyles = sides
    .flatMap(({ callouts }) => callouts)
    .map(
      ({ index }) =>
        `.diff-callout-${index}::after{content:"  ${calloutMarker(index)}"}`,
    )
    .join('');

  return (
    <BrowserOnly fallback={fallback}>
      {() => {
        // Skip Monaco for mobile/bots - use static fallback
        if (isMobileOrBot()) {
          return fallback;
        }
        return (
          <div className={styles.playgroundQueryContainer}>
            {markerStyles && <style>{markerStyles}</style>}
            <div
              className={clsx(
                styles.playgroundContainer,
                styles.standaloneEditor,
              )}
            >
              <div className={styles.playgroundTextEdit}>
                <div className={styles.playgroundEditor}>
                  <BaseDiffEditor
                    language={extensionToMonacoLanguage(sides[0].language)}
                    original={original}
                    modified={modified}
                    options={DIFF_OPTIONS}
                    onMount={handleDiffMount}
                    height={height}
                    theme={MONACO_THEME}
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
  );
}

export type DiffMonacoProps = {
  fallback: React.ReactNode;
  sides: readonly [DiffSide, DiffSide];
};

export type DiffSide = CalloutDocument & { language: string };

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
  // Built-in advanced (default). advanced-wasm / advanced-external need
  // @vscode/diff via VS Code module resolution — not available on CDN AMD.
  diffAlgorithm: 'advanced',
};
