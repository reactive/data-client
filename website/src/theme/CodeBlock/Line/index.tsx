import { usePrismTheme } from '@docusaurus/theme-common';
import type { Props } from '@theme/CodeBlock/Line';
import Line from '@theme-original/CodeBlock/Line';
import type { LineInputProps, Token } from 'prism-react-renderer';
import React, { useContext } from 'react';

import { PlaygroundHiddenContext } from '../../../components/Playground/hiddenContext';
import { mergeTokens } from '../../../components/Playground/editor/mergeTokens';

/** Docusaurus's line with as few elements as draw the same code
 * (mergeTokens; ./Token renders plain text bare). Code not shown yet (an
 * unselected tab, a closed details) is plain text until it shows. */
export default function LineWrapper(props: Props) {
  const { plain } = usePrismTheme();
  const hidden = useContext(PlaygroundHiddenContext);
  return (
    <Line
      {...props}
      line={
        hidden ?
          plainLine(props.line)
        : mergeTokens(props.line, props.getTokenProps, plain)
      }
      // the <pre> already draws the plain color
      getLineProps={(input: LineInputProps) => ({
        ...props.getLineProps(input),
        style: input.style,
      })}
    />
  );
}

function plainLine(line: Token[]): Token[] {
  if (line.length === 1 && line[0].empty) return line;
  return [{ types: ['plain'], content: line.map(t => t.content).join('') }];
}
