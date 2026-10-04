import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import marketplace from '../../../.claude-plugin/marketplace.json';

interface Props {
  repo?: string;
  /** Directory of the skills within repo; openskills installs one skill per path */
  skillsDir?: string;
  skill?: string;
  skills?: string[];
  /** Plugin from `.claude-plugin/marketplace.json` to install with its dependencies; adds a Claude Code tab */
  plugin?: string;
}

export default function SkillTabs({
  repo = 'reactive/data-client',
  skillsDir = '.agents/skills',
  skill,
  skills,
  plugin,
}: Props) {
  const allSkills =
    plugin ? pluginSkills(plugin) : (skills ?? (skill ? [skill] : []));
  const skillsCommand = [`npx skills add ${repo}`]
    .concat(allSkills.map(s => `--skill ${s}`))
    .join(allSkills.length > 1 ? ' \\\n  ' : ' ');
  // openskills has no --skill flag; it installs a single skill from its path
  const openSkillsCommand =
    allSkills.length ?
      allSkills
        .map(s => `npx openskills install ${repo}/${skillsDir}/${s}`)
        .join('\n')
    : `npx openskills install ${repo}`;
  const claudeCommand =
    plugin &&
    `claude plugin marketplace add ${repo}\nclaude plugin install ${plugin}@${marketplace.name}`;
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
        <CodeBlock className="language-bash">{skillsCommand}</CodeBlock>
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

const plugins: { name: string; dependencies?: string[]; skills: string[] }[] =
  marketplace.plugins;

/** Skill names of a marketplace plugin, after those of its dependencies */
function pluginSkills(name: string): string[] {
  const plugin = plugins.find(p => p.name === name);
  if (!plugin) throw new Error(`No plugin "${name}" in marketplace.json`);
  return [
    ...(plugin.dependencies ?? []).flatMap(pluginSkills),
    ...plugin.skills.map(path => path.split('/').pop() as string),
  ];
}
