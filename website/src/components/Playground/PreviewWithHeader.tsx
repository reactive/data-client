import Translate from '@docusaurus/Translate';
import { Fixture, Interceptor } from '@rest-hooks/test';
import React, { memo } from 'react';

import Header from './Header';
import Preview from './Preview';
import styles from './styles.module.css';

function PreviewWithHeader<T>({
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
}: Props<T>) {
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
          getInitialInterceptorData={getInitialInterceptorData}
        />
      </div>
    </div>
  );
}
export default memo(PreviewWithHeader);

interface Props<T = any> {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
}
