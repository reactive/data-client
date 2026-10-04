import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

interface Props {
  repo?: string;
  /** Directory of the skills within repo; openskills installs one skill per path */
  skillsDir?: string;
  skill?: string;
  skills?: string[];
  /** Skills for the OpenSkills tab when it should differ from `skills` (it has no picker groups) */
  openSkills?: string[];
  /** Plugins (skill groups) from the repo's `.claude-plugin/marketplace.json`; adds a Claude Code tab */
  plugins?: string[];
  /** `name` of the repo's `.claude-plugin/marketplace.json` */
  marketplace?: string;
}

export default function SkillTabs({
  repo = 'reactive/data-client',
  skillsDir = '.agents/skills',
  skill,
  skills,
  openSkills,
  plugins,
  marketplace = 'data-client',
}: Props) {
  const allSkills = skills ?? (skill ? [skill] : []);
  const skillFlag = allSkills.map(s => ` --skill ${s}`).join('');
  // openskills has no --skill flag; it installs a single skill from its path
  const openSkillList = openSkills ?? allSkills;
  const openSkillsCommand =
    openSkillList.length ?
      openSkillList
        .map(s => `npx openskills install ${repo}/${skillsDir}/${s}`)
        .join('\n')
    : `npx openskills install ${repo}`;
  const claudeCommand =
    plugins &&
    [
      `claude plugin marketplace add ${repo}`,
      ...plugins.map(p => `claude plugin install ${p}@${marketplace}`),
    ].join('\n');
  return (
    <Tabs
      defaultValue="skills"
      groupId="agent-skills-program"
      values={[
        { label: 'Skills', value: 'skills' },
        { label: 'OpenSkills', value: 'openskills' },
        ...(claudeCommand ? [{ label: 'Claude Code', value: 'claude' }] : []),
      ]}
    >
      <TabItem value="skills">
        <CodeBlock className="language-bash">
          npx skills add {repo}
          {skillFlag}
        </CodeBlock>
        {plugins && (
          <p>
            Select the {plugins.map(toGroupTitle).join(' and ')} groups (space
            toggles a whole group).
          </p>
        )}
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash">{openSkillsCommand}</CodeBlock>
      </TabItem>
      {claudeCommand && (
        <TabItem value="claude">
          <CodeBlock className="language-bash">{claudeCommand}</CodeBlock>
        </TabItem>
      )}
    </Tabs>
  );
}

// how the skills CLI picker titles a plugin's group
const toGroupTitle = (plugin: string) =>
  plugin
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
