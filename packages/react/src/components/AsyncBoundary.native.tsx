import React, { memo, Suspense } from 'react';
import type { JSX } from 'react';

import { boundaryParts } from './boundaryParts.js';
import type { Props } from './boundaryParts.js';

/**
 * Handles loading and error conditions of Suspense
 * @see https://dataclient.io/docs/api/AsyncBoundary
 */
function AsyncBoundary(props: Props): JSX.Element {
  const [suspenseProps, content] = boundaryParts(props);
  return <Suspense {...suspenseProps}>{content}</Suspense>;
}
export default memo(AsyncBoundary) as typeof AsyncBoundary;

export type { Props } from './boundaryParts.js';
