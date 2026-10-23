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
export default function FrameworkPlayground(
  props: React.ComponentProps<typeof HooksPlayground>,
) {
  const framework = useFramework();
  if (framework === 'vue')
    return (
      // a demo's code shows as row's tabs
      <TypeScriptEditor
        row={props.row || props.demo}
        defaultTab={props.defaultTab}
      >
        {props.children}
      </TypeScriptEditor>
    );
  return <HooksPlayground {...props} />;
}
