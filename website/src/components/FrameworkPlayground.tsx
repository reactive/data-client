import React from 'react';

import HooksPlayground from './HooksPlayground';
import TypeScriptEditor from './TypeScriptEditor';
import useFramework from './useFramework';

/**
 * Live HooksPlayground for React; static editor for Vue (no Vue runtime yet).
 *
 * Put shared code blocks (resources) directly inside, and framework-specific
 * components in :::react / :::vue blocks.
 */
export default function FrameworkPlayground({
  row,
  ...props
}: React.ComponentProps<typeof HooksPlayground>) {
  const framework = useFramework();
  if (framework === 'vue')
    return <TypeScriptEditor row={row}>{props.children}</TypeScriptEditor>;
  return <HooksPlayground row={row} {...props} />;
}
