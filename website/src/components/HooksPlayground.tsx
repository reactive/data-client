import React, { memo, useContext } from 'react';

import Playground, { type PlaygroundProps } from './Playground';
import { PlaygroundHiddenContext } from './Playground/hiddenContext';

/** MDX entry point: wraps one or more code fences in a live Playground. */
const HooksPlayground = ({
  children,
  groupId,
  hidden,
  defaultOpen = 'n',
  defaultActionsBy = 'request',
  row = false,
  demo = false,
  fixtures = [],
  defaultTab,
  renderCount,
  inFlight,
  actionLog,
  autoRun,
  getInitialInterceptorData = () => ({}),
}: PlaygroundProps) => {
  const inHiddenTab = useContext(PlaygroundHiddenContext);
  return (
    <Playground
      groupId={groupId}
      defaultOpen={defaultOpen}
      defaultActionsBy={defaultActionsBy}
      row={row}
      demo={demo}
      hidden={hidden ?? inHiddenTab}
      fixtures={fixtures}
      getInitialInterceptorData={getInitialInterceptorData}
      defaultTab={defaultTab}
      renderCount={renderCount}
      inFlight={inFlight}
      actionLog={actionLog}
      autoRun={autoRun}
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
};
export default memo(HooksPlayground);
