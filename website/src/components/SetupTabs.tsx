import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import AgentPrompt from './AgentPrompt';
import useFramework from './useFramework';
import { claudeSetupCommand } from '../../framework-docs/skillCommands.mjs';

/** Ways to set up Data Client with an agent: agents' own plugins first
 * (Claude Code's single terminal paste), then the prompt any agent takes in
 * its chat */
export default function SetupTabs() {
  const framework = useFramework();
  return (
    <Tabs groupId="agent-setup">
      <TabItem value="claude" label="Claude Code" default>
        <CodeBlock className="language-bash" metastring="framed">
          {claudeSetupCommand(framework)}
        </CodeBlock>
      </TabItem>
      <TabItem value="any" label="Any agent">
        <AgentPrompt framed />
      </TabItem>
    </Tabs>
  );
}
