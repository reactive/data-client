import React, { memo, Suspense, useContext } from 'react';
import type { JSX } from 'react';

import { BoundaryContext } from './BoundaryContext.js';
import { boundaryParts } from './boundaryParts.js';
import type { Props } from './boundaryParts.js';

/**
 * Handles loading and error conditions of Suspense
 * @see https://dataclient.io/docs/api/AsyncBoundary
 */
function AsyncBoundary(props: Props): JSX.Element {
  const wrap = useContext(BoundaryContext);
  const [suspenseProps, content] = boundaryParts(props);
  return wrap ?
      wrap(suspenseProps, content)
    : <Suspense {...suspenseProps}>{content}</Suspense>;
}
export default memo(AsyncBoundary) as typeof AsyncBoundary;

export type { Props } from './boundaryParts.js';
