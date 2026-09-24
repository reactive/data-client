import React, { memo } from 'react';

import Playground from './Playground';
import type { PlaygroundProps as BasePlaygroundProps } from './Playground';

const HooksPlayground = ({
  children,
  groupId,
  hidden = false,
  defaultOpen = 'n',
  row = false,
  fixtures = [],
  defaultTab,
  headerControls,
  getInitialInterceptorData = () => ({}),
  demo,
}: PlaygroundProps) => (
  <Playground
    groupId={groupId}
    defaultOpen={defaultOpen}
    row={row}
    hidden={hidden}
    fixtures={fixtures}
    getInitialInterceptorData={getInitialInterceptorData}
    defaultTab={defaultTab}
    headerControls={headerControls}
    demo={demo}
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

type PlaygroundProps<T = any> = Omit<
  BasePlaygroundProps<T>,
  'groupId' | 'row'
> & {
  groupId: string;
  row: boolean;
};
