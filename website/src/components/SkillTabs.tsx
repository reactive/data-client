import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import styles from './SkillTabs.module.css';
import useFramework from './useFramework';
import marketplace from '../../../.claude-plugin/marketplace.json';
import skillCommands from '../../framework-docs/skillCommands.mjs';

interface Props {
  repo?: string;
  skill?: string;
  skills?: string[];
  /** Plugin from `.claude-plugin/marketplace.json` to install with its dependencies.
   * Defaults to the current page's framework when no skills are given. */
  plugin?: string;
  /** false leaves out TanStack Intent, which needs the packages installed first */
  intent?: boolean;
  /** headers on the commands, where the page has room (```bash framed) */
  framed?: boolean;
}

export default function SkillTabs({
  repo,
  skill,
  skills,
  plugin,
  intent,
  framed,
}: Props) {
  const framework = useFramework();
  const metastring = framed ? 'framed' : undefined;
  const commands = skillCommands(
    { repo, skill, skills, plugin, intent, framework },
    marketplace,
  );
  return (
    <Tabs
      className={styles.tabs}
      defaultValue="claude"
      groupId="agent-skills-program"
      // Claude Code's own installer first, then skills that update with the packages
      values={[
        { label: 'Claude Code plugin', value: 'claude' },
        ...(commands.intent ?
          [{ label: 'TanStack Intent', value: 'intent' }]
        : []),
        { label: 'Skills CLI', value: 'skills' },
        { label: 'OpenSkills', value: 'openskills' },
      ]}
    >
      <TabItem value="claude">
        <CodeBlock className="language-bash" metastring={metastring}>
          {commands.claude}
        </CodeBlock>
      </TabItem>
      {commands.intent && (
        <TabItem value="intent">
          <CodeBlock className="language-bash" metastring={metastring}>
            {commands.intent}
          </CodeBlock>
        </TabItem>
      )}
      <TabItem value="skills">
        <CodeBlock className="language-bash" metastring={metastring}>
          {commands.skillsCli}
        </CodeBlock>
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash" metastring={metastring}>
          {commands.openSkills}
        </CodeBlock>
      </TabItem>
    </Tabs>
  );
}
