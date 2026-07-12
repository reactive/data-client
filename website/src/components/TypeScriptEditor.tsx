import clsx from 'clsx';
import React from 'react';

import { useCodeDocuments } from './Playground/editor/codeModel';
import EditorShell from './Playground/editor/EditorShell';
import EditorSurface from './Playground/editor/EditorSurface';
import styles from './Playground/styles.module.css';

export default function TypeScriptEditor({
  children,
  row,
}: {
  children: string | React.ReactNode | React.ReactNode[];
  row?: boolean;
}) {
  const model = useCodeDocuments(children);
  const isRow = row ?? model.documents.length > 1;

  return (
    <EditorShell>
      <div className={styles.playgroundQueryContainer}>
        <div
          className={clsx(styles.playgroundContainer, styles.standaloneEditor)}
        >
          <EditorSurface
            {...model}
            layout={isRow ? 'row' : 'stacked'}
            variant="standalone"
          />
        </div>
      </div>
    </EditorShell>
  );
}
