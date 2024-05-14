import type { Fixture, Interceptor } from '@data-client/test';
import React, { memo } from 'react';

import Playground from './Playground';

// React forces console.error, so we must demote it to warn
// see https://github.com/facebook/react/issues/15069
console.error = console.warn;

const HooksPlayground = ({
  children,
  groupId,
  hidden = false,
  defaultOpen = 'n',
  row = false,
  fixtures = [],
  defaultTab,
  getInitialInterceptorData = () => ({}),
}: PlaygroundProps) => (
  <Playground
    noInline
    groupId={groupId}
    defaultOpen={defaultOpen}
    row={row}
    hidden={hidden}
    fixtures={fixtures}
    getInitialInterceptorData={getInitialInterceptorData}
    defaultTab={defaultTab}
  >
    {typeof children === 'string' ?
      children
    : Array.isArray(children) ?
      children
    : children.props.children}
  </Playground>
);
export default memo(HooksPlayground);

//child.props.children.props.title

interface PlaygroundProps<T = any> {
  groupId: string;
  defaultOpen?: 'y' | 'n';
  row: boolean;
  hidden: boolean;
  fixtures?: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
  children: React.ReactNode;
  reverse?: boolean;
  defaultTab?: string;
}
