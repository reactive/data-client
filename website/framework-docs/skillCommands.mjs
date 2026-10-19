/**
 * Commands that install Data Client's agent skills, one per installer.
 * Shared by src/components/SkillTabs (site) and docsToMarkdown.mjs
 * (skill references, llms.txt), so both install the same skills.
 */

const skillsDir = '.agents/skills';

/** TanStack Intent loads the skills the installed `@data-client/*` packages ship */
const intentCommand = `# run after installing Data Client: loads the skills its packages ship
npm install -D @tanstack/intent
npx intent install`;

/**
 * @typedef {{ name: string, dependencies?: string[], skills: string[] }} Plugin
 * @typedef {{ name: string, plugins: Plugin[] }} Marketplace
 */

/**
 * @param {{ repo?: string, skill?: string, skills?: string[], plugin?: string, framework: string }} options
 *   with no skills, installs `plugin` (default: the framework's) with its dependencies
 * @param {Marketplace} marketplace `.claude-plugin/marketplace.json`
 * @returns {{ skillsCli: string, openSkills: string, claude: string, intent?: string }}
 */
export default function skillCommands(
  { repo = 'reactive/data-client', skill, skills, plugin, framework },
  marketplace,
) {
  // Intent loads every skill the packages ship, so it only fits the whole framework's set
  const intent = !skill && !skills && !plugin ? intentCommand : undefined;
  if (!skills && skill) skills = [skill];
  if (!skills) plugin ??= framework;
  const { plugins } = marketplace;
  const pluginSkills = name => {
    const p = plugins.find(p => p.name === name);
    if (!p) throw new Error(`No plugin "${name}" in marketplace.json`);
    return [
      ...(p.dependencies ?? []).flatMap(pluginSkills),
      ...p.skills.map(skillName),
    ];
  };
  const pluginOf = s => {
    const p = plugins.find(p => p.skills.some(path => skillName(path) === s));
    if (!p) throw new Error(`No plugin holds skill "${s}"`);
    return p.name;
  };

  const allSkills = plugin ? pluginSkills(plugin) : skills;
  // Claude Code installs whole plugins, so install each one holding a listed skill
  const claudePlugins =
    plugin ? [plugin] : [...new Set(allSkills.map(pluginOf))];
  return {
    intent,
    skillsCli: [
      `npx skills add ${repo}`,
      ...allSkills.map(s => `--skill ${s}`),
    ].join(allSkills.length > 1 ? ' \\\n  ' : ' '),
    // openskills has no --skill flag; it installs a single skill from its path
    openSkills: allSkills
      .map(s => `npx openskills install ${repo}/${skillsDir}/${s}`)
      .join('\n'),
    claude: [
      `claude plugin marketplace add ${repo}`,
      ...claudePlugins.map(
        p => `claude plugin install ${p}@${marketplace.name}`,
      ),
    ].join('\n'),
  };
}

const skillName = path => path.slice(path.lastIndexOf('/') + 1);
