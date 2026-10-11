/* global require, module */
/**
 * Emits https://llmstxt.org files after build, per docs instance:
 *
 *   /llms.txt, /llms-full.txt          React docs + shared (REST, GraphQL)
 *   /vue/llms.txt, /vue/llms-full.txt  Vue docs + shared
 *   /rest/llms.txt, /graphql/llms.txt  just that shared instance (and -full)
 *   <page URL>.md                      every doc page as plain markdown
 *
 * Markdown comes from docsToMarkdown, the same renderer the agent skills use, so
 * partials are inlined and only the requested framework's content remains.
 * Links between pages point at their .md versions.
 */
const { aliasedSitePathToRelativePath } = require('@docusaurus/utils');
const fs = require('fs');
const path = require('path');

const {
  DOCS_INSTANCES,
  FRAMEWORK_INSTANCES,
  frameworkInstance,
  trimRoute,
  mdRoute,
  llmsTxtRoute,
} = require('./framework-docs/docsInstances.js');

/** Docs every framework includes */
const shared = DOCS_INSTANCES.filter(d => !d.framework);

/** Sidebar items -> [{ label, docs: [doc] }] in sidebar order */
function sections(version, title) {
  const docsById = new Map(version.docs.map(doc => [doc.id, doc]));
  const byLabel = new Map();
  const seen = new Set();
  const push = (label, doc) => {
    if (!doc || seen.has(doc.id) || doc.unlisted || doc.draft) return;
    seen.add(doc.id);
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label).push(doc);
  };
  const walk = (items, label) => {
    for (const item of items) {
      if (item.type === 'doc' || item.type === 'ref')
        push(label, docsById.get(item.id));
      else if (item.type === 'category') {
        const nested = `${label} › ${item.label}`;
        if (item.link?.type === 'doc') push(nested, docsById.get(item.link.id));
        walk(item.items, nested);
      }
    }
  };
  for (const items of Object.values(version.sidebars)) walk(items, title);
  // pages not in any sidebar still get a .md, listed under "Other"
  for (const doc of version.docs) push(`${title} › Other`, doc);
  return [...byLabel].map(([label, docs]) => ({ label, docs }));
}

/** Docs instances come from framework-docs/docsInstances.js */
module.exports = function llmsPlugin(context) {
  return {
    name: 'llms-plugin',
    async postBuild({ outDir, plugins, siteConfig: { url } }) {
      // agents read the English source; other locales would only copy it
      if (context.i18n.currentLocale !== context.i18n.defaultLocale) return;
      const { docToMarkdown, ROOT } =
        await import('./framework-docs/docsToMarkdown.mjs');

      // docs instance id -> its folder and sidebar sections
      const instances = new Map(
        DOCS_INSTANCES.map(({ id, framework, name }) => {
          const plugin = plugins.find(
            p =>
              p.name === 'docusaurus-plugin-content-docs' &&
              (p.options.id ?? 'default') === id,
          );
          const version = plugin.content.loadedVersions.find(
            v => v.versionName === 'current',
          );
          return [
            id,
            {
              dir: path.resolve(context.siteDir, plugin.options.path),
              shared: !framework,
              sections: sections(version, framework ? 'Core' : name),
            },
          ];
        }),
      );

      // links between rendered pages point at their markdown
      const routes = new Set(
        [...instances.values()].flatMap(({ sections }) =>
          sections.flatMap(s => s.docs.map(doc => trimRoute(doc.permalink))),
        ),
      );
      const resolveRoute = route => {
        const [, pathname, hash] = route.match(/^([^#?]*)(.*)$/);
        return routes.has(trimRoute(pathname)) ?
            `${url}${mdRoute(pathname)}${hash}`
          : `${url}${route}`;
      };

      const write = (file, content) => {
        const target = path.join(outDir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      };

      /** A doc as markdown; framework instances render from their source (Vue via its mirror) */
      const render = (id, doc, framework) => {
        const source = path.resolve(
          context.siteDir,
          aliasedSitePathToRelativePath(doc.source),
        );
        // the mirror has docs/core's layout; docToMarkdown applies `.vue.md`
        // overrides and front matter itself
        const { dir, shared } = instances.get(id);
        const file =
          shared ? source : (
            path.join(
              ROOT,
              frameworkInstance(framework).path,
              path.relative(dir, source),
            )
          );
        const content = docToMarkdown(file, framework, { resolveRoute });
        if (content === undefined)
          throw new Error(`llms-plugin: ${file} has no ${framework} page`);
        return content;
      };

      const [defaultSite] = FRAMEWORK_INSTANCES;
      const seeFrameworks = except =>
        FRAMEWORK_INSTANCES.filter(o => o !== except).map(
          o => `Using ${o.name}? See ${url}${llmsTxtRoute(o.id)}`,
        );
      /** Title, summary and intro of a docs instance's llms.txt */
      const header = instance => {
        const { id, name, framework } = instance;
        // shared docs instance ids are their package names
        if (!framework)
          return [
            `# Data Client for ${name}`,
            `> @data-client/${id}: ${name} endpoints and schemas for Reactive Data Client. Its full docs, with framework hooks, are in the framework llms.txt files.`,
            [`Package: @data-client/${id}.`, ...seeFrameworks()].join(' '),
          ];
        const packages = [framework, ...shared.map(d => d.id)].map(
          pkg => `@data-client/${pkg}`,
        );
        return [
          `# Data Client for ${name}`,
          `> Reactive Data Client: async state management for ${name} with normalized, type-safe data from REST, GraphQL, and any other source.`,
          [
            `Packages: ${packages.join(', ')}.`,
            ...seeFrameworks(instance),
          ].join(' '),
        ];
      };

      /** Writes llms.txt and llms-full.txt for a docs instance */
      const writeLlms = (instance, all) => {
        const file = parts =>
          `${[...header(instance), ...parts].join('\n\n')}\n`;
        write(
          `${instance.llms}llms.txt`,
          file(
            all.map(
              ({ label, pages }) =>
                `## ${label}\n\n${pages
                  .map(
                    p =>
                      `- [${p.title}](${url}${p.md})${p.description ? `: ${p.description}` : ''}`,
                  )
                  .join('\n')}`,
            ),
          ),
        );
        write(
          `${instance.llms}llms-full.txt`,
          file(
            all
              .flatMap(s => s.pages)
              .map(
                p => `<!-- Source: ${url}${p.md} -->\n\n${p.content.trim()}`,
              ),
          ),
        );
      };

      /**
       * A docs instance's sections rendered for a framework. Shared docs render
       * per framework so their links stay in it; their one .md per URL is the
       * default framework's, like the HTML page.
       */
      const sectionsFor = (id, framework) =>
        instances.get(id).sections.map(({ label, docs }) => ({
          label,
          pages: docs.map(doc => ({
            title: doc.title,
            // Docusaurus falls back to the first paragraph, often a fragment
            description: doc.frontMatter.description,
            md: mdRoute(doc.permalink),
            content: render(id, doc, framework),
          })),
        }));

      /** instance id -> sections in its own framework (shared: the default) */
      const rendered = new Map();
      for (const instance of DOCS_INSTANCES) {
        const sections = sectionsFor(
          instance.id,
          instance.framework ?? defaultSite.framework,
        );
        rendered.set(instance.id, sections);
        for (const page of sections.flatMap(s => s.pages))
          write(page.md, page.content);
        // each shared package also gets its own, for agents that only need its API
        if (!instance.framework) writeLlms(instance, sections);
      }
      for (const site of FRAMEWORK_INSTANCES) {
        writeLlms(site, [
          ...rendered.get(site.id),
          ...shared.flatMap(({ id }) =>
            site === defaultSite ?
              rendered.get(id)
            : sectionsFor(id, site.framework),
          ),
        ]);
      }
    },
  };
};
