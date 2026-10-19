import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import styles from './SkillTabs.module.css';
import useFramework from './useFramework';
import skillPackages from '../../../.agents/skill-packages.json';
import setupReferences from '../../../.agents/skills/data-client-setup/references.json';
import skillCommands from '../../framework-docs/skillCommands.mjs';

interface Props {
  repo?: string;
  skill?: string;
  /** Defaults to every skill for the current page's framework */
  skills?: string[];
  /** false leaves out linking the packages' skills, which needs them installed first */
  packages?: boolean;
  /** headers on the commands, where the page has room (```bash framed) */
  framed?: boolean;
}

export default function SkillTabs({
  repo,
  skill,
  skills,
  packages,
  framed,
}: Props) {
  const framework = useFramework();
  const metastring = framed ? 'framed' : undefined;
  const commands = skillCommands(
    { repo, skill, skills, packages, framework },
    { skillPackages, setupSkills: setupReferences.skills },
  );
  return (
    <Tabs
      className={styles.tabs}
      defaultValue="claude"
      groupId="agent-skills-program"
      // Claude Code's own installer first, then skills that update with the packages
      values={[
        { label: 'Claude Code plugin', value: 'claude' },
        ...(commands.packages ?
          [{ label: 'Installed packages', value: 'packages' }]
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
      {commands.packages && (
        <TabItem value="packages">
          <CodeBlock className="language-bash" metastring={metastring}>
            {commands.packages}
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
