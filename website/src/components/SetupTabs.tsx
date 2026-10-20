import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import AgentPrompt from './AgentPrompt';
import useFramework from './useFramework';
import { claudeSetupCommand } from '../../framework-docs/skillCommands.mjs';

/** Ways to set up Data Client with an agent: the prompt any agent takes in
 * its chat, and Claude Code's single terminal paste */
export default function SetupTabs() {
  const framework = useFramework();
  return (
    <Tabs groupId="agent-setup">
      <TabItem value="any" label="Any agent" default>
        <AgentPrompt framed />
      </TabItem>
      <TabItem value="claude" label="Claude Code">
        <CodeBlock className="language-bash" metastring="framed">
          {claudeSetupCommand(framework)}
        </CodeBlock>
      </TabItem>
    </Tabs>
  );
}
