/* global require, module, __dirname */
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
const fs = require('fs');
const path = require('path');

/** docs/core, which every framework's docs instance renders (Vue via a mirror) */
const CORE = path.resolve(__dirname, '../docs/core');

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
      const { docToMarkdown } =
        await import('./framework-docs/docsToMarkdown.mjs');

      // docs instance -> what to render it as
      const sets = new Map([
        ...Object.entries(frameworks).map(([framework, { id }]) => [
          id,
          { framework, title: 'Core', core: true },
        ]),
        ...Object.entries(shared).map(([id, title]) => [
          id,
          { framework: 'react', title },
        ]),
      ]);
      for (const [id, set] of sets) {
        const plugin = plugins.find(
          p =>
            p.name === 'docusaurus-plugin-content-docs' &&
            (p.options.id ?? 'default') === id,
        );
        set.dir = path.resolve(context.siteDir, plugin.options.path);
        set.sections = sections(
          plugin.content.loadedVersions.find(v => v.versionName === 'current'),
          set.title,
        );
      }

      // links between rendered pages point at their markdown
      const routes = new Set(
        [...sets.values()].flatMap(set =>
          set.sections.flatMap(s => s.docs.map(doc => trim(doc.permalink))),
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

      // Render and write each page once; shared docs are reused by every framework
      for (const set of sets.values()) {
        for (const section of set.sections) {
          section.docs = section.docs.map(doc => {
            const source = path.resolve(
              context.siteDir,
              doc.source.replace(/^@site\//, ''),
            );
            // the Vue mirror has the same layout as docs/core; docToMarkdown
            // applies `.vue.md` overrides and front matter itself
            const file =
              set.core ?
                path.join(CORE, path.relative(set.dir, source))
              : source;
            const content = docToMarkdown(file, set.framework, {
              resolveRoute,
            });
            if (content === undefined)
              throw new Error(
                `llms-plugin: ${file} has no ${set.framework} page`,
              );
            const md = `${trim(doc.permalink)}.md`;
            write(md, content);
            return {
              title: doc.title,
              // Docusaurus falls back to the first paragraph, often a fragment
              description: doc.frontMatter.description,
              md,
              content,
            };
          });
        }
      }

      for (const [framework, site] of Object.entries(frameworks)) {
        const others = Object.entries(frameworks)
          .filter(([other]) => other !== framework)
          .map(([, o]) => `Using ${o.name}? See ${url}${o.path}llms.txt`);
        const header = [
          `# Data Client for ${site.name}`,
          `> Reactive Data Client: async state management for ${site.name} with normalized, type-safe data from REST, GraphQL, and any other source.`,
          [
            `Packages: @data-client/${framework}, @data-client/rest, @data-client/graphql.`,
            ...others,
          ].join(' '),
        ].join('\n\n');
        const all = [site.id, ...Object.keys(shared)].flatMap(
          id => sets.get(id).sections,
        );

        const index = all.map(
          ({ label, docs }) =>
            `## ${label}\n\n${docs
              .map(
                d =>
                  `- [${d.title}](${url}${d.md})${d.description ? `: ${d.description}` : ''}`,
              )
              .join('\n')}\n`,
        );
        write(`${site.path}llms.txt`, [`${header}\n`, ...index].join('\n'));

        const full = all
          .flatMap(s => s.docs)
          .map(d => `<!-- Source: ${url}${d.md} -->\n\n${d.content.trim()}\n`);
        write(`${site.path}llms-full.txt`, [`${header}\n`, ...full].join('\n'));
      }
    },
  };
};
