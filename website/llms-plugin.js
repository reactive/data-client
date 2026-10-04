/* global require, module */
/**
 * Emits https://llmstxt.org files after build:
 *
 *   /llms.txt, /llms-full.txt          React docs + REST + GraphQL
 *   /vue/llms.txt, /vue/llms-full.txt  Vue docs + REST + GraphQL
 *   <page permalink>.md                every listed doc page as plain markdown
 *
 * Markdown comes from docsToMarkdown, the same renderer the agent skills use, so
 * partials are inlined and only the requested framework's content remains.
 * Links between pages point at their .md versions.
 */
const fs = require('fs');
const path = require('path');

/**
 * `@site/../docs/.core-vue/api/useSuspense.md` -> absolute docs/core path;
 * docToMarkdown applies the `.vue.md` override and front matter itself
 */
const resolveSource = (siteDir, source) =>
  path.resolve(
    siteDir,
    source
      .replace(/^@site\//, '')
      .replace(/\/docs\/\.core-\w+\//, '/docs/core/'),
  );

/** Route without trailing slash (`/docs/` -> `/docs`) */
const trim = route => route.replace(/(.)\/$/, '$1');

/** Where a page's markdown is written and linked: its URL + `.md` */
const mdPath = permalink => `${trim(permalink)}.md`;

/** Sidebar items -> [{ label, docs: [doc] }] in sidebar order */
function sections(version, title) {
  const docsById = new Map(version.docs.map(doc => [doc.id, doc]));
  const seen = new Set();
  const out = [];
  const push = (label, doc) => {
    if (!doc || seen.has(doc.id) || doc.unlisted || doc.draft) return;
    seen.add(doc.id);
    let section = out.find(s => s.label === label);
    if (!section) out.push((section = { label, docs: [] }));
    section.docs.push(doc);
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
  return out;
}

module.exports = function llmsPlugin(context, { sites, docsSets }) {
  return {
    name: 'llms-plugin',
    async postBuild({ outDir, plugins, siteConfig }) {
      const { url } = siteConfig;
      const docsContent = id =>
        plugins
          .find(
            p =>
              p.name === 'docusaurus-plugin-content-docs' &&
              (p.options.id ?? 'default') === id,
          )
          .content.loadedVersions.find(v => v.versionName === 'current');

      const sets = new Map(
        Object.entries(docsSets).map(([name, { id, title, framework }]) => [
          name,
          { framework, sections: sections(docsContent(id), title) },
        ]),
      );
      // links between rendered pages point at their markdown
      const routes = new Set(
        [...sets.values()].flatMap(set =>
          set.sections.flatMap(s => s.docs.map(doc => trim(doc.permalink))),
        ),
      );
      const resolveRoute = route => {
        const [, pathname, hash] = route.match(/^([^#?]*)(.*)$/);
        return routes.has(trim(pathname)) ?
            `${url}${mdPath(pathname)}${hash}`
          : `${url}${route}`;
      };

      // Each docs instance's pages, rendered once per framework
      const { docToMarkdown } =
        await import('./framework-docs/docsToMarkdown.mjs');
      const rendered = new Map(
        [...sets].map(([name, { framework, sections }]) => [
          name,
          sections.map(section => ({
            ...section,
            docs: section.docs.flatMap(doc => {
              const content = docToMarkdown(
                resolveSource(context.siteDir, doc.source),
                framework,
                { resolveRoute },
              );
              if (content === undefined) return [];
              return {
                title: doc.title,
                // Docusaurus falls back to the first paragraph, often a fragment
                description: doc.frontMatter.description,
                md: mdPath(doc.permalink),
                content,
              };
            }),
          })),
        ]),
      );

      const write = (file, content) => {
        const target = path.join(outDir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      };

      for (const sections of rendered.values())
        for (const doc of sections.flatMap(s => s.docs))
          write(doc.md, doc.content);

      for (const site of sites) {
        const all = site.docs.flatMap(name => rendered.get(name));

        const header = `# ${site.title}\n\n> ${site.summary}\n\n${site.details}\n`;
        const index = all.map(
          ({ label, docs }) =>
            `## ${label}\n\n${docs
              .map(
                d =>
                  `- [${d.title}](${url}${d.md})${d.description ? `: ${d.description}` : ''}`,
              )
              .join('\n')}\n`,
        );
        write(`${site.path}llms.txt`, [header, ...index].join('\n'));

        const full = all
          .flatMap(s => s.docs)
          .map(d => `<!-- Source: ${url}${d.md} -->\n\n${d.content.trim()}\n`);
        write(`${site.path}llms-full.txt`, [header, ...full].join('\n'));
      }
    },
  };
};
