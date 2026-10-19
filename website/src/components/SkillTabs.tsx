import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import marketplace from '../../../.claude-plugin/marketplace.json';
import skillCommands from '../../framework-docs/skillCommands.mjs';
import styles from './SkillTabs.module.css';
import useFramework from './useFramework';

interface Props {
  repo?: string;
  skill?: string;
  skills?: string[];
  /** Plugin from `.claude-plugin/marketplace.json` to install with its dependencies.
   * Defaults to the current page's framework when no skills are given. */
  plugin?: string;
}

const intentCommand = `# run after installing Data Client: loads the skills its packages ship
npm install -D @tanstack/intent
npx intent install`;

export default function SkillTabs({ repo, skill, skills, plugin }: Props) {
  const framework = useFramework();
  const commands = skillCommands(
    { repo, skill, skills, plugin, framework },
    marketplace,
  );
  // Intent loads every skill the installed packages ship, so it only fits the whole framework's set
  const intent = !skill && !skills && !plugin;
  return (
    <Tabs
      className={styles.tabs}
      defaultValue="claude"
      groupId="agent-skills-program"
      // Claude Code's own installer first, then skills that update with the packages
      values={[
        { label: 'Claude Code plugin', value: 'claude' },
        ...(intent ? [{ label: 'TanStack Intent', value: 'intent' }] : []),
        { label: 'Skills CLI', value: 'skills' },
        { label: 'OpenSkills', value: 'openskills' },
      ]}
    >
      <TabItem value="claude">
        <CodeBlock className="language-bash">{commands.claude}</CodeBlock>
      </TabItem>
      {intent && (
        <TabItem value="intent">
          <CodeBlock className="language-bash">{intentCommand}</CodeBlock>
        </TabItem>
      )}
      <TabItem value="skills">
        <CodeBlock className="language-bash">{commands.skillsCli}</CodeBlock>
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash">{commands.openSkills}</CodeBlock>
      </TabItem>
    </Tabs>
  );
}
