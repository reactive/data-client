/**
 * Commands that install Data Client's agent skills, one per installer.
 * Shared by the site (SkillTabs, AgentPrompt), docsToMarkdown.mjs (skill
 * references) and llms-plugin.js (llms.txt), so they all install the same skills.
 */

const skillsDir = '.agents/skills';

/** Links the skills the installed `@data-client/*` packages ship into .agents/skills */
export const linkCommand = 'npx --no data-client-skills';
const packagesCommand = `# after installing Data Client: links the skills its packages ship
${linkCommand}`;

/** Installs the setup skill, which sets up Data Client; agents run it from the setup prompt and llms.txt */
export const setupCommand =
  'npx skills add reactive/data-client --skill data-client-setup -y';

/**
 * One terminal paste for Claude Code: installs the plugin for the project
 * (teammates get it from .claude/settings.json), then starts its setup skill.
 * The prompt has no backticks, which the shell would run.
 */
export const claudeSetupCommand = framework =>
  [
    // --sparse checks out only the plugin and its skills, not the whole repo
    'claude plugin marketplace add reactive/data-client --scope project \\\n    --sparse .claude-plugin .agents/skills',
    'claude plugin install data-client@data-client --scope project',
    `claude "/data-client:data-client-setup Set up @data-client/${framework} and use it for all API data"`,
  ].join(' && \\\n  ');

/**
 * @typedef {{ skillPackages: Record<string, string[]>, setupSkills: string[], plugin: { plugins: { name: string, skills: string[] }[] } }} SkillSources
 *   `.agents/skill-packages.json`, the protocol setup skills
 *   `data-client-setup` bundles (its `references.json` `skills`), and
 *   `.claude-plugin/marketplace.json`
 */

/**
 * @param {{ repo?: string, skill?: string, skills?: string[], packages?: boolean, framework: string }} options
 *   with no skills, installs every skill for the framework;
 *   `packages: false` leaves out linking the packages' skills where they aren't installed yet
 * @param {SkillSources} sources
 * @returns {{ skillsCli: string, openSkills: string, claude?: string, packages?: string }}
 */
export default function skillCommands(
  {
    repo = 'reactive/data-client',
    skill,
    skills,
    packages: withPackages = true,
    framework,
  },
  { skillPackages, setupSkills, plugin },
) {
  const chosen = skills ?? (skill && [skill]);
  // links every skill the packages ship, so it only fits the whole framework's set
  const packages = withPackages && !chosen ? packagesCommand : undefined;
  const allSkills =
    chosen ?? frameworkSkills(framework, skillPackages, setupSkills);
  const carried = pluginSkills(plugin);
  return {
    packages,
    skillsCli: [
      `npx skills add ${repo}`,
      ...allSkills.map(s => `--skill ${s}`),
    ].join(allSkills.length > 1 ? ' \\\n  ' : ' '),
    // openskills has no --skill flag; it installs a single skill from its path
    openSkills: allSkills
      .map(s => `npx openskills install ${repo}/${skillsDir}/${s}`)
      .join('\n'),
    // The plugin sets up new apps, which then link the whole framework's set;
    // other skills it doesn't carry. The marketplace's other entries are old
    // names kept for existing installs.
    claude:
      !chosen || allSkills.every(s => carried.includes(s)) ?
        [
          `claude plugin marketplace add ${repo}`,
          'claude plugin install data-client@data-client',
        ].join('\n')
      : undefined,
  };
}

/** Skill names the data-client plugin carries */
function pluginSkills(plugin) {
  return plugin.plugins
    .find(({ name }) => name === 'data-client')
    .skills.map(skill => skill.split('/').pop());
}

/** Skills of every package a framework's app installs, plus the protocol
 * setup skills that data-client-setup bundles instead of a package owning */
function frameworkSkills(framework, skillPackages, setupSkills) {
  const other = framework === 'react' ? 'vue' : 'react';
  return [
    ...Object.entries(skillPackages)
      .filter(([pkg]) => pkg !== `@data-client/${other}`)
      .flatMap(([, skills]) => skills),
    ...setupSkills,
  ];
}
