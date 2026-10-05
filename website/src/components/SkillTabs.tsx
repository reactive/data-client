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
}

export default function SkillTabs({
  repo = 'reactive/data-client',
  skillsDir = '.agents/skills',
  skill,
  skills,
  openSkills,
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
  return (
    <Tabs
      defaultValue="skills"
      groupId="agent-skills-program"
      values={[
        { label: 'Skills', value: 'skills' },
        { label: 'OpenSkills', value: 'openskills' },
      ]}
    >
      <TabItem value="skills">
        <CodeBlock className="language-bash">
          npx skills add {repo}
          {skillFlag}
        </CodeBlock>
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash">{openSkillsCommand}</CodeBlock>
      </TabItem>
    </Tabs>
  );
}
