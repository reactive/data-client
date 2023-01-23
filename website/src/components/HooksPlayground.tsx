import type { Fixture, Interceptor } from '@rest-hooks/test';
import React, { memo } from 'react';

import Playground from './Playground';

const HooksPlayground = ({
  children,
  groupId,
  hidden = false,
  defaultOpen,
  row = false,
  fixtures,
}: PlaygroundProps) => (
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
  fixtures: [] as Fixture[],
};
export default memo(HooksPlayground);

//child.props.children.props.title

interface PlaygroundProps {
  groupId: string;
  defaultOpen: 'y' | 'n';
  row: boolean;
  hidden: boolean;
  fixtures: (Fixture | Interceptor)[];
  children: React.ReactNode;
  reverse?: boolean;
  includeEndpoints: boolean;
}
