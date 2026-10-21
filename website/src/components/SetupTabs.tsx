import Translate from '@docusaurus/Translate';
import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import AgentPrompt from './AgentPrompt';
import styles from './SetupTabs.module.css';
import useFramework from './useFramework';
import {
  claudePluginCommand,
  claudeSetupPrompt,
  codexPluginCommand,
  cursorPluginCommand,
  cursorSetupPrompt,
  codexSetupPrompt,
} from '../../framework-docs/skillCommands.mjs';

/** Puts the agent's brand mark before its tab label */
const logo = (className: string) => ({
  className: `${styles.logo} ${className}`,
});

/** Ways to set up Data Client with an agent: agents' own plugins first
 * (install, then start setup in the agent's chat), then the
 * prompt other agents take in their chat */
export default function SetupTabs() {
  const framework = useFramework();
  return (
    <Tabs groupId="agent-setup" className={styles.tabs}>
      <TabItem
        value="claude"
        attributes={logo(styles.claude)}
        label="Claude Code"
        default
      >
        <CodeBlock className="language-bash" metastring="framed">
          {claudePluginCommand}
        </CodeBlock>
        <AgentPrompt
          prompt={claudeSetupPrompt(framework)}
          title="Claude Code"
          framed
        />
      </TabItem>
      <TabItem value="cursor" attributes={logo(styles.cursor)} label="Cursor">
        <AgentPrompt prompt={cursorPluginCommand} title="Cursor" framed />
        <p>
          <Translate
            id="setupTabs.cursorNewChat"
            description="Between Cursor's plugin install prompt and its setup prompt"
          >
            Then, in a new chat:
          </Translate>
        </p>
        <AgentPrompt
          prompt={cursorSetupPrompt(framework)}
          title="Cursor"
          framed
        />
      </TabItem>
      <TabItem value="codex" attributes={logo(styles.codex)} label="Codex">
        <CodeBlock className="language-bash" metastring="framed">
          {codexPluginCommand}
        </CodeBlock>
        <AgentPrompt
          prompt={codexSetupPrompt(framework)}
          title="Codex"
          framed
        />
      </TabItem>
      <TabItem
        value="other"
        attributes={logo(styles.other)}
        label="Other agents"
      >
        <AgentPrompt framed />
      </TabItem>
    </Tabs>
  );
}
