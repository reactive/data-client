import clsx from 'clsx';
import React, { useContext } from 'react';

import { useCodeDocuments } from './Playground/editor/codeModel';
import EditorSurface from './Playground/editor/EditorSurface';
import { HiddenContext, useShownOnce } from './Playground/hiddenContext';
import styles from './Playground/styles.module.css';

export default function TypeScriptEditor({
  children,
  row = true,
  defaultTab,
}: {
  children: string | React.ReactNode | React.ReactNode[];
  row?: boolean;
  defaultTab?: string;
}) {
  const model = useCodeDocuments(children, defaultTab);
  // Plain text while hidden (HiddenContext), then Monaco stays so undo
  // survives switching back. Same latch as Playground.
  const [interactive] = useShownOnce(useContext(HiddenContext));

  return (
    <div className={styles.playgroundQueryContainer}>
      <div
        // row={false}: as a stacked playground's code (several files open
        // at once show side by side)
        className={clsx(
          styles.playgroundContainer,
          styles.standaloneEditor,
          styles.row,
          { [styles.stacked]: !row },
        )}
      >
        <EditorSurface
          {...model}
          interactive={interactive}
          layout={row ? 'row' : 'stacked'}
          variant="standalone"
        />
      </div>
    </div>
  );
}
