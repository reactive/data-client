import React, { memo } from 'react';
import type { FixtureEndpoint } from '@rest-hooks/test';

import Playground from './Playground';

const HooksPlayground = ({
  children,
  groupId,
  hidden = false,
  defaultOpen,
  row = false,
  fixtures,
}) => (
  <Playground
    includeEndpoints={!Array.isArray(children)}
    noInline
    groupId={groupId}
    defaultOpen={defaultOpen}
    row={row}
    hidden={hidden}
    fixtures={fixtures}
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
  fixtures: [] as FixtureEndpoint[],
};
export default memo(HooksPlayground);

//child.props.children.props.title
