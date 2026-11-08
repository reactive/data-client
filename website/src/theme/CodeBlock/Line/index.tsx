import { usePrismTheme } from '@docusaurus/theme-common';
import type { Props } from '@theme/CodeBlock/Line';
import Line from '@theme-original/CodeBlock/Line';
import type { LineInputProps } from 'prism-react-renderer';
import React from 'react';

import { mergeTokens } from '../../../components/Playground/editor/mergeTokens';

/** Docusaurus's line with as few elements as draw the same code
 * (mergeTokens; ./Token renders plain text bare) */
export default function LineWrapper(props: Props) {
  const { plain } = usePrismTheme();
  return (
    <Line
      {...props}
      line={mergeTokens(props.line, props.getTokenProps, plain)}
      // the <pre> already draws the plain color
      getLineProps={(input: LineInputProps) => ({
        ...props.getLineProps(input),
        style: input.style,
      })}
    />
  );
}
