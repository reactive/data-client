import clsx from 'clsx';
import React from 'react';

import { useCodeDocuments } from './Playground/editor/codeModel';
import EditorSurface from './Playground/editor/EditorSurface';
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

  return (
    <div className={styles.playgroundQueryContainer}>
      <div
        className={clsx(styles.playgroundContainer, styles.standaloneEditor, {
          [styles.row]: row,
        })}
      >
        <EditorSurface
          {...model}
          layout={row ? 'row' : 'stacked'}
          variant="standalone"
        />
      </div>
    </div>
  );
}
