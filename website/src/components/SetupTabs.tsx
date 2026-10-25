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
  setupPrompt,
  setupTask,
} from '../../framework-docs/skillCommands.mjs';

interface Props {
  /** what the setup skill does, in place of setting up Data Client, like
   * "Migrate this app from axios to `@data-client/rest`" */
  task?: string;
}

/** Ways to set up Data Client with an agent: agents' own plugins first
 * (install, then start setup in the agent's chat), then the
 * prompt other agents take in their chat */
export default function SetupTabs({ task }: Props) {
  const framework = useFramework();
  const request = task || setupTask(framework);
  return (
    <Tabs groupId="agent-setup" className={styles.tabs}>
      <TabItem
        value="claude"
        attributes={{ className: styles.claude }}
        label="Claude Code"
        default
      >
        <CodeBlock className="language-bash" metastring="framed">
          {claudePluginCommand}
        </CodeBlock>
        <AgentPrompt
          prompt={claudeSetupPrompt(request)}
          title="Claude Code"
          framed
        />
      </TabItem>
      <TabItem
        value="cursor"
        attributes={{ className: styles.cursor }}
        label="Cursor"
      >
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
          prompt={cursorSetupPrompt(request)}
          title="Cursor"
          framed
        />
      </TabItem>
      <TabItem
        value="codex"
        attributes={{ className: styles.codex }}
        label="Codex"
      >
        <CodeBlock className="language-bash" metastring="framed">
          {codexPluginCommand}
        </CodeBlock>
        <AgentPrompt prompt={codexSetupPrompt(request)} title="Codex" framed />
      </TabItem>
      <TabItem
        value="other"
        attributes={{ className: styles.other }}
        label="Other agents"
      >
        {/* the default prompt is translated */}
        <AgentPrompt prompt={task ? setupPrompt(task) : undefined} framed />
      </TabItem>
    </Tabs>
  );
}
