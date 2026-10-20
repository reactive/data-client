import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import AgentPrompt from './AgentPrompt';
import useFramework from './useFramework';
import {
  claudePluginCommand,
  claudeSetupPrompt,
  codexPluginCommand,
  codexSetupPrompt,
} from '../../framework-docs/skillCommands.mjs';

/** Ways to set up Data Client with an agent: agents' own plugins first
 * (install in a terminal, then start setup in the agent's chat), then the
 * prompt other agents take in their chat */
export default function SetupTabs() {
  const framework = useFramework();
  return (
    <Tabs groupId="agent-setup">
      <TabItem value="claude" label="Claude Code" default>
        <CodeBlock className="language-bash" metastring="framed">
          {claudePluginCommand}
        </CodeBlock>
        <AgentPrompt
          prompt={claudeSetupPrompt(framework)}
          title="Claude Code"
          framed
        />
      </TabItem>
      <TabItem value="codex" label="Codex">
        <CodeBlock className="language-bash" metastring="framed">
          {codexPluginCommand}
        </CodeBlock>
        <AgentPrompt
          prompt={codexSetupPrompt(framework)}
          title="Codex"
          framed
        />
      </TabItem>
      <TabItem value="other" label="Other agents">
        <AgentPrompt framed />
      </TabItem>
    </Tabs>
  );
}
