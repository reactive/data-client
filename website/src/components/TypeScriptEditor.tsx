import clsx from 'clsx';
import React, { useContext, useState } from 'react';

import { useCodeDocuments } from './Playground/editor/codeModel';
import EditorSurface from './Playground/editor/EditorSurface';
import { PlaygroundHiddenContext } from './Playground/hiddenContext';
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
  // A PlaygroundTabs tab that is not selected: plain text until first shown,
  // then Monaco stays so undo survives switching back. Same latch as Playground.
  const hidden = useContext(PlaygroundHiddenContext);
  const [interactive, setInteractive] = useState(!hidden);
  if (!hidden && !interactive) setInteractive(true);

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
