import React from 'react';
import * as restHooks from 'rest-hooks';
import * as rest from '@rest-hooks/rest';
import * as graphql from '@rest-hooks/graphql';
import BigNumber from 'bignumber.js';

import Playground from './Playground';

const scope = { ...restHooks, ...rest, ...graphql, BigNumber };

const HooksPlayground = ({ children, groupId = 'playground', defaultOpen }) => (
  <Playground
    scope={scope}
    noInline
    groupId={groupId}
    defaultOpen={defaultOpen}
  >
    {typeof children === 'string'
      ? children
      : children.props.children.props.children}
  </Playground>
);
export default HooksPlayground;
