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
 * - llms: where that framework's llms.txt and llms-full.txt are served
 */
const DOCS_INSTANCES = [
  {
    id: 'default',
    framework: 'react',
    name: 'React',
    path: 'docs/core',
    routeBasePath: 'docs',
    llms: '/',
  },
  {
    id: 'vue',
    framework: 'vue',
    name: 'Vue',
    path: 'docs/core',
    routeBasePath: 'vue',
    llms: '/vue/',
  },
  { id: 'rest', name: 'REST', path: 'docs/rest', routeBasePath: 'rest' },
  {
    id: 'graphql',
    name: 'GraphQL',
    path: 'docs/graphql',
    routeBasePath: 'graphql',
  },
];

/** Instances rendering docs/core, one per framework */
const FRAMEWORK_INSTANCES = DOCS_INSTANCES.filter(d => d.framework);
const FRAMEWORKS = FRAMEWORK_INSTANCES.map(d => d.framework);

const docsInstance = id => DOCS_INSTANCES.find(d => d.id === id);
const frameworkInstance = framework =>
  FRAMEWORK_INSTANCES.find(d => d.framework === framework);

module.exports = {
  DOCS_INSTANCES,
  FRAMEWORK_INSTANCES,
  FRAMEWORKS,
  docsInstance,
  frameworkInstance,
};
