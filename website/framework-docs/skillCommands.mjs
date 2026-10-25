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
 * Installs the Claude Code plugin for the project, so teammates get it from
 * .claude/settings.json; --sparse checks out only the plugin and its skills
 */
export const claudePluginCommand = [
  'claude plugin marketplace add reactive/data-client --scope project \\\n  --sparse .claude-plugin .agents/skills',
  'claude plugin install data-client@data-client --scope project',
].join('\n');

const setupTask = framework =>
  `Set up \`@data-client/${framework}\` and use it for all API data`;

/** The prompt any agent takes: installs the setup skill, then follows it.
 * AgentPrompt's translate() default repeats it as a literal for i18n extraction */
export const setupPrompt = pkg =>
  `${setupTask(pkg)}. Install its setup skill first: \`${setupCommand}\`, then follow it.`;

/** Starts the plugin's setup skill by name; through the router skill, Claude
 * would read it from the plugin cache, outside the project, and ask first */
export const claudeSetupPrompt = framework =>
  `/data-client:data-client-setup ${setupTask(framework)}`;

/** Installs the Cursor plugin from .cursor-plugin, typed in Cursor's agent
 * chat; its skills load from the next chat */
const cursorPlugin = repo =>
  `/add-plugin data-client@https://github.com/${repo}`;
export const cursorPluginCommand = cursorPlugin('reactive/data-client');

/** Cursor starts a plugin skill by its own name */
export const cursorSetupPrompt = framework =>
  `/data-client-setup ${setupTask(framework)}`;

/**
 * Codex reads the Claude Code marketplace; --sparse checks out only the
 * plugin and its skills. Codex installs plugins for the user, with no project scope
 */
const codexPlugin = repo =>
  [
    `codex plugin marketplace add ${repo} \\\n  --sparse .claude-plugin --sparse ${skillsDir}`,
    'codex plugin add data-client@data-client',
  ].join('\n');
export const codexPluginCommand = codexPlugin('reactive/data-client');

/** Codex starts a skill when the prompt mentions it as `$plugin:skill` */
export const codexSetupPrompt = framework =>
  `$data-client:data-client-setup ${setupTask(framework)}`;

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
 * @returns {{ skillsCli: string, openSkills: string, claude?: string, cursor?: string, codex?: string, packages?: string }}
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
  // The plugin sets up new apps, which then link the whole framework's set;
  // other skills it doesn't carry
  const carried = pluginSkills(plugin);
  const withPlugin = !chosen || allSkills.every(s => carried.includes(s));
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
    ...(withPlugin && {
      // the marketplace's other entries are old names kept for existing installs
      claude: [
        `claude plugin marketplace add ${repo}`,
        'claude plugin install data-client@data-client',
      ].join('\n'),
      // the same plugin from .cursor-plugin, pinned to master: Cursor otherwise
      // checks out main, which this repo doesn't have
      cursor: cursorPlugin(repo),
      codex: codexPlugin(repo),
    }),
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
