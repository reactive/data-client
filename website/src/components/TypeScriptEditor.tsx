import clsx from 'clsx';
import React from 'react';

import { PlaygroundTextEdit, useCode } from './Playground/PlaygroundTextEdit';
import styles from './Playground/styles.module.css';

export default function TypeScriptEditor({ children, path }) {
  const { handleCodeChange, codes, codeTabs } = useCode(children);
  return (
    <div className={clsx(styles.playgroundContainer, styles.standaloneEditor)}>
      <PlaygroundTextEdit
        fixtures={[]}
        row={codeTabs.length > 1 ? true : false}
        codeTabs={codeTabs}
        handleCodeChange={handleCodeChange}
        codes={codes}
        large={true}
      />
    </div>
  );
}
