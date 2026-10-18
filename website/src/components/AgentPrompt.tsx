import { translate } from '@docusaurus/Translate';
import CodeBlock from '@theme/CodeBlock';
import React from 'react';

import styles from './AgentPrompt.module.css';
import useFramework from './useFramework';

/** One-line prompt that gets a coding agent to set up Data Client */
export default function AgentPrompt({ title }: { title?: string }) {
  const framework = useFramework();
  return (
    <div className={styles.agentPrompt}>
      <CodeBlock language="markdown" title={title}>
        {translate(
          {
            id: 'agentPrompt.prompt',
            message:
              'Use Reactive Data Client (`@data-client/{framework}` and `@data-client/rest`) for data fetching.',
            description: 'Prompt readers copy into their coding agent',
          },
          { framework },
        )}
      </CodeBlock>
    </div>
  );
}
