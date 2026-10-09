/* global module */
/**
 * Every docs instance on the site, read by docusaurus.config.ts (plugin
 * options), docsToMarkdown.mjs (routes) and llms-plugin.js (llms.txt).
 *
 * Instances with a `framework` render docs/core for that framework (Vue via
 * the generated mirror, see index.js); the rest are shared by every framework.
 *
 * - id: docs plugin instance id
 * - path: source folder, relative to the repo root (for Vue, the source its
 *   mirror is generated from)
 * - routeBasePath: site route of the instance
 * - llms: where the instance's llms.txt and llms-full.txt are served
 * - exclude: unpublished pages (globs), besides Docusaurus' defaults
 */
const DOCS_INSTANCES = [
  {
    id: 'default',
    framework: 'react',
    name: 'React',
    path: 'docs/core',
    routeBasePath: 'docs',
    llms: '/',
    exclude: ['getting-started/README.md', '**/*.vue.{md,mdx}'],
  },
  {
    id: 'vue',
    framework: 'vue',
    name: 'Vue',
    path: 'docs/core',
    routeBasePath: 'vue',
    llms: '/vue/',
    exclude: ['getting-started/README.md'],
  },
  {
    id: 'rest',
    name: 'REST',
    path: 'docs/rest',
    routeBasePath: 'rest',
    llms: '/rest/',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    path: 'docs/graphql',
    routeBasePath: 'graphql',
    llms: '/graphql/',
  },
];

/** Instances rendering docs/core, one per framework */
const FRAMEWORK_INSTANCES = DOCS_INSTANCES.filter(d => d.framework);
const FRAMEWORKS = FRAMEWORK_INSTANCES.map(d => d.framework);

const docsInstance = id => DOCS_INSTANCES.find(d => d.id === id);
const frameworkInstance = framework =>
  FRAMEWORK_INSTANCES.find(d => d.framework === framework);

/** Route without trailing slash (`/docs/` -> `/docs`) */
const trimRoute = route => route.replace(/(.)\/$/, '$1');
/** Where llms-plugin.js serves a doc page's markdown */
const mdRoute = permalink => `${trimRoute(permalink)}.md`;
/** Where llms-plugin.js serves a docs instance's llms.txt */
const llmsTxtRoute = id => `${docsInstance(id).llms}llms.txt`;
/**
 * Folder (relative to the repo root) of an instance's translations, where
 * Docusaurus looks for them; pages missing there render in English
 */
const localizedPath = (id, locale) =>
  `website/i18n/${locale}/docusaurus-plugin-content-docs${id === 'default' ? '' : `-${id}`}/current`;

module.exports = {
  DOCS_INSTANCES,
  FRAMEWORK_INSTANCES,
  FRAMEWORKS,
  docsInstance,
  frameworkInstance,
  trimRoute,
  mdRoute,
  llmsTxtRoute,
  localizedPath,
};
