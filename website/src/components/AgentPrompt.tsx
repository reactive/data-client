import { translate } from '@docusaurus/Translate';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import React from 'react';

import styles from './AgentPrompt.module.css';
import useFramework from './useFramework';

/** One-line prompt that gets a coding agent to set up Data Client.
 * docsToMarkdown.mjs renders the same text for the docs' markdown. */
export default function AgentPrompt({
  title,
  className,
}: {
  title?: string;
  className?: string;
}) {
  const framework = useFramework();
  return (
    <div className={clsx(styles.agentPrompt, className)}>
      {/* markdown, so package names in backticks become spans that never wrap */}
      <CodeBlock language="markdown" title={title}>
        {translate(
          {
            id: 'agentPrompt.prompt',
            message: 'Use `@data-client/{framework}` for all server state',
            description:
              'Prompt readers copy into their coding agent. Keep the backticks around package names: they keep each name on one line.',
          },
          { framework },
        )}
      </CodeBlock>
    </div>
  );
}
