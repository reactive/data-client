/* global require, module */
/**
 * Emits https://llmstxt.org files after build, per framework:
 *
 *   /llms.txt, /llms-full.txt          React docs + shared (REST, GraphQL)
 *   /vue/llms.txt, /vue/llms-full.txt  Vue docs + shared
 *   <page URL>.md                      every doc page as plain markdown
 *
 * Markdown comes from docsToMarkdown, the same renderer the agent skills use, so
 * partials are inlined and only the requested framework's content remains.
 * Links between pages point at their .md versions.
 */
const { aliasedSitePathToRelativePath } = require('@docusaurus/utils');
const fs = require('fs');
const path = require('path');

/** Route without trailing slash (`/docs/` -> `/docs`) */
const trim = route => route.replace(/(.)\/$/, '$1');

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

/**
 * @param {object} options
 * @param {Record<string, { id: string, path: string, name: string }>} options.frameworks
 *   framework -> its docs instance id, site path, and display name
 * @param {Record<string, string>} options.shared docs instance id -> title, for docs every framework includes
 */
module.exports = function llmsPlugin(context, { frameworks, shared }) {
  return {
    name: 'llms-plugin',
    async postBuild({ outDir, plugins, siteConfig: { url } }) {
      const { docToMarkdown, ROOT } =
        await import('./framework-docs/docsToMarkdown.mjs');
      const core = path.join(ROOT, 'docs/core');

      // docs instance id -> its folder and sidebar sections
      const instances = new Map(
        [
          ...Object.values(frameworks).map(({ id }) => [id, 'Core']),
          ...Object.entries(shared),
        ].map(([id, title]) => {
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
              sections: sections(version, title),
            },
          ];
        }),
      );

      // links between rendered pages point at their markdown
      const routes = new Set(
        [...instances.values()].flatMap(({ sections }) =>
          sections.flatMap(s => s.docs.map(doc => trim(doc.permalink))),
        ),
      );
      const resolveRoute = route => {
        const [, pathname, hash] = route.match(/^([^#?]*)(.*)$/);
        return routes.has(trim(pathname)) ?
            `${url}${trim(pathname)}.md${hash}`
          : `${url}${route}`;
      };

      const write = (file, content) => {
        const target = path.join(outDir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      };

      /** A doc as markdown; framework instances render from docs/core (Vue via its mirror) */
      const render = (id, doc, framework) => {
        const source = path.resolve(
          context.siteDir,
          aliasedSitePathToRelativePath(doc.source),
        );
        // the mirror has docs/core's layout; docToMarkdown applies `.vue.md`
        // overrides and front matter itself
        const file =
          id in shared ? source : (
            path.join(core, path.relative(instances.get(id).dir, source))
          );
        const content = docToMarkdown(file, framework, { resolveRoute });
        if (content === undefined)
          throw new Error(`llms-plugin: ${file} has no ${framework} page`);
        return content;
      };

      const [defaultFramework] = Object.keys(frameworks);
      for (const [framework, site] of Object.entries(frameworks)) {
        // Shared docs render per framework so their links stay in it. Their
        // one .md per URL is the default framework's, like the HTML page.
        const all = [site.id, ...Object.keys(shared)].flatMap(id =>
          instances.get(id).sections.map(({ label, docs }) => ({
            label,
            pages: docs.map(doc => {
              const page = {
                title: doc.title,
                // Docusaurus falls back to the first paragraph, often a fragment
                description: doc.frontMatter.description,
                md: `${trim(doc.permalink)}.md`,
                content: render(id, doc, framework),
              };
              if (!(id in shared) || framework === defaultFramework)
                write(page.md, page.content);
              return page;
            }),
          })),
        );

        const others = Object.entries(frameworks)
          .filter(([other]) => other !== framework)
          .map(([, o]) => `Using ${o.name}? See ${url}${o.path}llms.txt`);
        // shared docs instance ids are their package names
        const packages = [framework, ...Object.keys(shared)].map(
          name => `@data-client/${name}`,
        );
        const file = parts =>
          `${[
            `# Data Client for ${site.name}`,
            `> Reactive Data Client: async state management for ${site.name} with normalized, type-safe data from REST, GraphQL, and any other source.`,
            [`Packages: ${packages.join(', ')}.`, ...others].join(' '),
            ...parts,
          ].join('\n\n')}\n`;

        write(
          `${site.path}llms.txt`,
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
          `${site.path}llms-full.txt`,
          file(
            all
              .flatMap(s => s.pages)
              .map(
                p => `<!-- Source: ${url}${p.md} -->\n\n${p.content.trim()}`,
              ),
          ),
        );
      }
    },
  };
};
