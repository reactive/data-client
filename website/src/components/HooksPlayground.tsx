import type { Fixture, Interceptor } from '@rest-hooks/test';
import React, { memo } from 'react';

import Playground from './Playground';

const HooksPlayground = ({
  children,
  groupId,
  hidden = false,
  defaultOpen,
  row = false,
  next = false,
  fixtures,
  getInitialInterceptorData,
}: PlaygroundProps) => (
  <Playground
    includeEndpoints={!Array.isArray(children)}
    noInline
    groupId={groupId}
    defaultOpen={defaultOpen}
    row={row}
    next={next}
    hidden={hidden}
    fixtures={fixtures}
    getInitialInterceptorData={getInitialInterceptorData}
  >
    {typeof children === 'string'
      ? children
      : Array.isArray(children)
      ? children
      : children.props.children}
  </Playground>
);
HooksPlayground.defaultProps = {
  defaultOpen: 'n' as const,
  fixtures: [] as Fixture[],
  getInitialInterceptorData: () => ({}),
};
export default memo(HooksPlayground);

//child.props.children.props.title

interface PlaygroundProps<T = any> {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  next?: boolean;
  hidden: boolean;
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData?: () => T;
  children: React.ReactNode;
  reverse?: boolean;
  includeEndpoints: boolean;
}
