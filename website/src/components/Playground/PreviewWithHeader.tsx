import React, { memo } from 'react';
import Translate from '@docusaurus/Translate';

import Preview from './Preview';
import styles from './styles.module.css';
import Header from './Header';

function PreviewWithHeader({ groupId, defaultOpen, row, fixtures }) {
  return (
    <div
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <Header>
        <Translate
          id="theme.Playground.result"
          description="The result label of the live codeblocks"
        >
          Live Preview
        </Translate>
      </Header>
      <div className={styles.playgroundResult}>
        <Preview
          groupId={groupId}
          defaultOpen={defaultOpen}
          row={row}
          fixtures={fixtures}
        />
      </div>
    </div>
  );
}
export default memo(PreviewWithHeader);
