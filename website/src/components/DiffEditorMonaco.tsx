import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  DiffEditor as BaseDiffEditor,
  type MonacoDiffEditor,
} from '@monaco-editor/react';
import clsx from 'clsx';
import { type editor } from 'monaco-editor';
import { useCallback, useMemo, useState } from 'react';

import type { DiffSide } from './Playground/editor/callouts';
import StaticEditor from './Playground/editor/StaticEditor';
import { extensionToMonacoLanguage } from './Playground/monaco/language';
import { options } from './Playground/monaco/options';
import './Playground/monaco/setup';
import { MONACO_THEME } from './Playground/monaco/theme';
import useAutoHeight from './Playground/monaco/useAutoHeight';
import useEditorCover from './Playground/monaco/useEditorCover';
import useOverflowWidgets from './Playground/monaco/useOverflowWidgets';
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

  const { covered, coverRef, revealWhenPainted } = useEditorCover();
  // hovers out of the frame, which clips to its rounded corners
  const overflowWidgets = useOverflowWidgets();
  const mountOverflowWidgets = overflowWidgets.handleMount;
  // stable: new options would reset the glyph margin handleDiffMount removes
  const diffOptions = useMemo(
    () => ({ ...DIFF_OPTIONS, ...overflowWidgets.options }),
    [overflowWidgets.options],
  );

  // Left edge of each pane's code, so labels line up with the first column
  const [labelOffsets, setLabelOffsets] = useState<number[]>();
  const handleDiffMount = useCallback(
    (editor: MonacoDiffEditor) => {
      handleMount(editor);
      const panes = [editor.getOriginalEditor(), editor.getModifiedEditor()];
      panes.forEach(mountOverflowWidgets);
      // Side-by-side forces a glyph margin on the original pane; nothing
      // renders there in this read-only diff, so it only indents the code
      panes[0].updateOptions({ glyphMargin: false });
      // Reveal the diff whole: its marks and the blank rows that line the
      // panes up come with its first computation, maybe after the tokens.
      // Bounded, in case that never reports
      const reveal = () => {
        diffReady.dispose();
        clearTimeout(diffTimeout);
        revealWhenPainted(panes);
      };
      const diffReady = editor.onDidUpdateDiff(reveal);
      const diffTimeout = setTimeout(reveal, DIFF_WAIT_MS);
      editor.onDidDispose(() => clearTimeout(diffTimeout));
      if (editor.getLineChanges()) reveal();
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
    [handleMount, mountOverflowWidgets, revealWhenPainted, sides],
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
                styles.diffFrame,
              )}
            >
              <div className={styles.playgroundTextEdit}>
                <div className={styles.diffLabels} aria-hidden>
                  {sides.map(({ title }, i) => (
                    <span key={i} style={{ left: labelOffsets?.[i] }}>
                      {title}
                    </span>
                  ))}
                </div>
                <div className={styles.playgroundEditor}>
                  <div className={clsx(styles.editorHost, styles.diffHost)}>
                    <BaseDiffEditor
                      language={extensionToMonacoLanguage(sides[0].language)}
                      original={original}
                      modified={modified}
                      options={diffOptions}
                      onMount={handleDiffMount}
                      height={height}
                      theme={MONACO_THEME}
                      loading={null}
                      // Prevent "TextModel got disposed before DiffEditorWidget model got reset" error
                      // by not letting @monaco-editor/react manage model disposal
                      keepCurrentOriginalModel
                      keepCurrentModifiedModel
                    />
                    {covered ?
                      <div
                        ref={coverRef}
                        className={clsx(styles.editorCover, styles.diffCover)}
                      >
                        {sides.map(({ language, editorValue }, i) => (
                          <StaticEditor
                            key={i}
                            language={language}
                            code={editorValue}
                          />
                        ))}
                      </div>
                    : null}
                  </div>
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

/** Longest the cover waits for the first diff before it waits on the panes */
const DIFF_WAIT_MS = 6000;

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
