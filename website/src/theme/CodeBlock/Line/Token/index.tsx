import type { Props } from '@theme/CodeBlock/Line/Token';
import React from 'react';

import { isPlainToken } from '../../../../components/Playground/editor/mergeTokens';

/** Plain text is bare: its line already draws the plain color (../ merges
 * tokens) */
export default function LineToken({ line, token, ...props }: Props) {
  if (isPlainToken(token)) return <>{props.children}</>;
  return <span {...props} />;
}
