import React, { memo } from 'react';

import Playground, { type PlaygroundProps } from './Playground';

/** MDX entry point: wraps one or more code fences in a live Playground. */
const HooksPlayground = ({
  children,
  groupId,
  hidden = false,
  defaultOpen = 'n',
  row = false,
  fixtures = [],
  defaultTab,
  headerControls,
  renderCount,
  getInitialInterceptorData = () => ({}),
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
    renderCount={renderCount}
  >
    {/* A single fence arrives as one <pre> element; unwrap it to its <code> */}
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
