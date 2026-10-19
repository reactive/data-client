import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import AgentPrompt from './AgentPrompt';
import styles from './SkillTabs.module.css';
import useFramework from './useFramework';
import skillPackages from '../../../.agents/skill-packages.json';
import setupReferences from '../../../.agents/skills/data-client-setup/references.json';
import plugin from '../../../.claude-plugin/marketplace.json';
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
    { skillPackages, setupSkills: setupReferences.skills, plugin },
  );
  // agents' own plugin installers first, then skills that update with the packages
  const tabs = [
    { label: 'Claude Code plugin', value: 'claude', code: commands.claude },
    { label: 'Cursor plugin', value: 'cursor', code: commands.cursor },
    { label: 'Codex plugin', value: 'codex', code: commands.codex },
    { label: 'Installed packages', value: 'packages', code: commands.packages },
    { label: 'Skills CLI', value: 'skills', code: commands.skillsCli },
    { label: 'OpenSkills', value: 'openskills', code: commands.openSkills },
  ].filter(tab => tab.code);
  return (
    <Tabs
      className={styles.tabs}
      defaultValue={tabs[0].value}
      groupId="agent-skills-program"
      values={tabs}
    >
      {tabs.map(({ value, code }) => (
        <TabItem key={value} value={value}>
          {/* typed into Cursor's Agent chat, not a terminal */}
          {value === 'cursor' ?
            <AgentPrompt prompt={code} title="Cursor" framed={framed} />
          : <CodeBlock className="language-bash" metastring={metastring}>
              {code}
            </CodeBlock>
          }
        </TabItem>
      ))}
    </Tabs>
  );
}
