import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import marketplace from '../../../.claude-plugin/marketplace.json';
import useFramework from './useFramework';

interface Props {
  repo?: string;
  skill?: string;
  skills?: string[];
  /** Plugin from `.claude-plugin/marketplace.json` to install with its dependencies.
   * Defaults to the current page's framework when no skills are given. */
  plugin?: string;
}

const skillsDir = '.agents/skills';

export default function SkillTabs({
  repo = 'reactive/data-client',
  skill,
  skills,
  plugin,
}: Props) {
  const framework = useFramework();
  if (!skills && skill) skills = [skill];
  if (!skills) plugin ??= framework;
  const allSkills = plugin ? pluginSkills(plugin) : (skills ?? []);
  const skillsCommand = [
    `npx skills add ${repo}`,
    ...allSkills.map(s => `--skill ${s}`),
  ].join(allSkills.length > 1 ? ' \\\n  ' : ' ');
  // openskills has no --skill flag; it installs a single skill from its path
  const openSkillsCommand = allSkills
    .map(s => `npx openskills install ${repo}/${skillsDir}/${s}`)
    .join('\n');
  // Claude Code installs whole plugins, so install each one holding a listed skill
  const claudePlugins =
    plugin ? [plugin] : [...new Set(allSkills.map(pluginOf))];
  const claudeCommand = [
    `claude plugin marketplace add ${repo}`,
    ...claudePlugins.map(p => `claude plugin install ${p}@${marketplace.name}`),
  ].join('\n');
  return (
    <Tabs
      defaultValue="skills"
      groupId="agent-skills-program"
      values={[
        { label: 'Skills', value: 'skills' },
        { label: 'OpenSkills', value: 'openskills' },
        { label: 'Claude Code', value: 'claude' },
      ]}
    >
      <TabItem value="skills">
        <CodeBlock className="language-bash">{skillsCommand}</CodeBlock>
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash">{openSkillsCommand}</CodeBlock>
      </TabItem>
      <TabItem value="claude">
        <CodeBlock className="language-bash">{claudeCommand}</CodeBlock>
      </TabItem>
    </Tabs>
  );
}

const plugins: { name: string; dependencies?: string[]; skills: string[] }[] =
  marketplace.plugins;

const skillName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

/** Skill names of a marketplace plugin, after those of its dependencies */
function pluginSkills(name: string): string[] {
  const plugin = plugins.find(p => p.name === name);
  if (!plugin) throw new Error(`No plugin "${name}" in marketplace.json`);
  return [
    ...(plugin.dependencies ?? []).flatMap(pluginSkills),
    ...plugin.skills.map(skillName),
  ];
}

/** Name of the marketplace plugin that holds a skill */
function pluginOf(skill: string): string {
  const plugin = plugins.find(p => p.skills.some(s => skillName(s) === skill));
  if (!plugin) throw new Error(`No plugin holds skill "${skill}"`);
  return plugin.name;
}
