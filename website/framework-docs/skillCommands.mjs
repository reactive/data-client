/**
 * Commands that install Data Client's agent skills, one per installer.
 * Shared by src/components/SkillTabs (site) and docsToMarkdown.mjs
 * (skill references, llms.txt), so both install the same skills.
 */

const skillsDir = '.agents/skills';

/** Links the skills the installed `@data-client/*` packages ship into .agents/skills */
const packagesCommand = `# after installing Data Client: links the skills its packages ship
npx --no data-client-skills`;

/**
 * @typedef {{ skillPackages: Record<string, string[]>, setupSkills: string[] }} SkillSources
 *   `.agents/skill-packages.json`, and the protocol setup skills
 *   `data-client-setup` bundles (its `references.json` `skills`)
 */

/**
 * @param {{ repo?: string, skill?: string, skills?: string[], packages?: boolean, framework: string }} options
 *   with no skills, installs every skill for the framework;
 *   `packages: false` leaves out linking the packages' skills where they aren't installed yet
 * @param {SkillSources} sources
 * @returns {{ skillsCli: string, openSkills: string, claude: string, packages?: string }}
 */
export default function skillCommands(
  {
    repo = 'reactive/data-client',
    skill,
    skills,
    packages: withPackages = true,
    framework,
  },
  { skillPackages, setupSkills },
) {
  // links every skill the packages ship, so it only fits the whole framework's set
  const packages =
    withPackages && !skill && !skills ? packagesCommand : undefined;
  const allSkills =
    skills ??
    (skill ? [skill] : frameworkSkills(framework, skillPackages, setupSkills));
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
    // The plugin sets up new apps; the marketplace's other entries are old
    // names kept for existing installs
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
