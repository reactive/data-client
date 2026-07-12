import type { Fixture, Interceptor } from '@data-client/test';
import React, { memo } from 'react';

import Playground from './Playground';

const HooksPlayground = ({
  children,
  groupId,
  defaultOpen = 'n',
  row = false,
  fixtures = [],
  defaultTab,
  headerControls,
  getInitialInterceptorData = () => ({}),
}: PlaygroundProps) => (
  <Playground
    groupId={groupId}
    defaultOpen={defaultOpen}
    row={row}
    fixtures={fixtures}
    getInitialInterceptorData={getInitialInterceptorData}
    defaultTab={defaultTab}
    headerControls={headerControls}
  >
    {typeof children === 'string' ?
      children
    : Array.isArray(children) ?
      children
    : React.isValidElement<{ children: React.ReactNode }>(children) ?
      children.props.children
    : ''}
  </Playground>
);
export default memo(HooksPlayground);

interface PlaygroundProps<T = any> {
  groupId: string;
  defaultOpen?: 'y' | 'n';
  row: boolean;
  fixtures?: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
  children: React.ReactNode;
  defaultTab?: string;
  headerControls?: React.ReactNode;
}
