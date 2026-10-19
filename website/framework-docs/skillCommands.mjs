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
 * @typedef {{ skillPackages: Record<string, string[]>, setupSkills: string[] }} SkillSources
 *   `.agents/skill-packages.json`, and the protocol setup skills
 *   `data-client-setup` bundles (its `references.json` `skills`)
 */

/**
 * @param {{ repo?: string, skill?: string, skills?: string[], intent?: boolean, framework: string }} options
 *   with no skills, installs every skill for the framework;
 *   `intent: false` leaves out TanStack Intent where the packages aren't installed yet
 * @param {SkillSources} sources
 * @returns {{ skillsCli: string, openSkills: string, claude: string, intent?: string }}
 */
export default function skillCommands(
  {
    repo = 'reactive/data-client',
    skill,
    skills,
    intent: withIntent = true,
    framework,
  },
  { skillPackages, setupSkills },
) {
  // Intent loads every skill the packages ship, so it only fits the whole framework's set
  const intent = withIntent && !skill && !skills ? intentCommand : undefined;
  const allSkills =
    skills ??
    (skill ? [skill] : frameworkSkills(framework, skillPackages, setupSkills));
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
    // The one plugin points the agent at the skills of the installed packages;
    // the marketplace's other entries are old names kept for existing installs
    claude: [
      `claude plugin marketplace add ${repo}`,
      'claude plugin install data-client@data-client',
    ].join('\n'),
  };
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
