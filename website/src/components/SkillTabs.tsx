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
  /** Also offer TanStack Intent, which loads the skills shipped inside the
   * installed `@data-client/*` packages (so only for a whole framework's skills) */
  intent?: boolean;
}

const intentCommand = `# run after installing Data Client: loads the skills its packages ship
npm install -D @tanstack/intent
npx intent install`;

export default function SkillTabs({
  repo,
  skill,
  skills,
  plugin,
  intent = false,
}: Props) {
  const framework = useFramework();
  const commands = skillCommands(
    { repo, skill, skills, plugin, framework },
    marketplace,
  );
  return (
    <Tabs
      className={styles.tabs}
      defaultValue="skills"
      groupId="agent-skills-program"
      values={[
        { label: 'Skills CLI', value: 'skills' },
        { label: 'OpenSkills', value: 'openskills' },
        { label: 'Claude Code plugin', value: 'claude' },
        ...(intent ? [{ label: 'TanStack Intent', value: 'intent' }] : []),
      ]}
    >
      <TabItem value="skills">
        <CodeBlock className="language-bash">{commands.skills}</CodeBlock>
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash">{commands.openSkills}</CodeBlock>
      </TabItem>
      <TabItem value="claude">
        <CodeBlock className="language-bash">{commands.claude}</CodeBlock>
      </TabItem>
      {intent && (
        <TabItem value="intent">
          <CodeBlock className="language-bash">{intentCommand}</CodeBlock>
        </TabItem>
      )}
    </Tabs>
  );
}
