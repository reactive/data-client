import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  DiffEditor as BaseDiffEditor,
  type MonacoDiffEditor,
} from '@monaco-editor/react';
import clsx from 'clsx';
import { type editor } from 'monaco-editor';
import { useCallback, useState } from 'react';

import type { DiffSide } from './Playground/editor/callouts';
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

  // Left edge of each pane's code, so labels line up with the first column
  const [labelOffsets, setLabelOffsets] = useState<number[]>();
  const handleDiffMount = useCallback(
    (editor: MonacoDiffEditor) => {
      handleMount(editor);
      const panes = [editor.getOriginalEditor(), editor.getModifiedEditor()];
      // Side-by-side forces a glyph margin on the original pane; nothing
      // renders there in this read-only diff, so it only indents the code
      panes[0].updateOptions({ glyphMargin: false });
      const updateOffsets = () => {
        const left = editor.getContainerDomNode().getBoundingClientRect().left;
        const next = panes.map(
          pane =>
            (pane.getDomNode()?.getBoundingClientRect().left ?? left) -
            left +
            pane.getLayoutInfo().contentLeft,
        );
        setLabelOffsets(prev =>
          prev?.every((offset, i) => offset === next[i]) ? prev : next,
        );
      };
      updateOffsets();
      // Both panes lay out together; disposed along with the pane
      panes[1].onDidLayoutChange(updateOffsets);

      // Mark each callout's line with the marker its legend entry uses. Monaco
      // doesn't render injected `after` text here, so DiffEditor.module.css
      // draws the marker as ::after content.
      panes.forEach((pane, i) => {
        const model = pane.getModel();
        if (!model) return;
        pane.createDecorationsCollection(
          sides[i].callouts.map(({ line, index }) => {
            const column = model.getLineMaxColumn(line);
            return {
              range: {
                startLineNumber: line,
                startColumn: column,
                endLineNumber: line,
                endColumn: column,
              },
              options: { afterContentClassName: `diff-callout-${index}` },
            };
          }),
        );
      });
    },
    [handleMount, sides],
  );

  return (
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
                <div className={styles.diffLabels} aria-hidden>
                  {sides.map(({ title }, i) => (
                    <span
                      key={i}
                      style={{
                        left: labelOffsets?.[i] ?? (i ? '50%' : undefined),
                      }}
                    >
                      {title || (i ? 'After' : 'Before')}
                    </span>
                  ))}
                </div>
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
