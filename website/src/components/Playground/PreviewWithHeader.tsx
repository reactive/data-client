import { Fixture, Interceptor } from '@data-client/test';
import React, { memo } from 'react';

import Preview from './Preview';
import PreviewWrapper from './PreviewWrapper';

function PreviewWithHeader<T>({
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
}: Props<T>) {
  return (
    <PreviewWrapper>
      <Preview
        groupId={groupId}
        defaultOpen={defaultOpen}
        row={row}
        fixtures={fixtures}
        getInitialInterceptorData={getInitialInterceptorData}
      />
    </PreviewWrapper>
  );
}
export default memo(PreviewWithHeader);

interface Props<T> {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
}
