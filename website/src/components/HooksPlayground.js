import React from 'react';
import * as restHooks from 'rest-hooks';
import * as rest from '@rest-hooks/rest';
import * as graphql from '@rest-hooks/graphql';

import Playground from './Playground';

const scope = { ...restHooks, ...rest, ...graphql };

const HooksPlayground = ({ children }) => (
  <Playground scope={scope} noInline>
    {children}
  </Playground>
);
export default HooksPlayground;
