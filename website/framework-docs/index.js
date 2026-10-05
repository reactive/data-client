/* global require, module, __dirname, Buffer */
/**
 * Single-source framework docs (authoring conventions in ./README.md).
 *
 * `docs/core` is rendered directly for React at /docs. Vue renders a generated
 * mirror (docs/.core-vue, gitignored) at /vue, because two docs instances
 * cannot share one folder.
 */
const fs = require('fs');
const path = require('path');

// Docusaurus' own route rules (slug, category index), so links match its routes
const getSlug = require('@docusaurus/plugin-content-docs/lib/slug.js').default;

const { FRAMEWORKS, frameworkInstance } = require('./docsInstances.js');

const SRC = path.resolve(__dirname, '../..', frameworkInstance('react').path);
const MD = /\.mdx?$/;
/** `foo.vue.md` replaces `foo.md` for Vue */
const VUE_OVERRIDE = /\.vue(\.mdx?)$/;
const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

/** Files under `dir`, relative to it, with forward slashes (as `docIdOf` expects) */
function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, base);
    return [path.relative(base, full).split(path.sep).join('/')];
  });
}

const readSrc = file => fs.readFileSync(path.join(SRC, file), 'utf8');
const frontMatter = content => content.match(FM)?.[1] ?? '';
/** One front matter value, unquoted */
const frontMatterValue = (content, key) =>
  frontMatter(content)
    .match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'))?.[1]
    .replace(/^(['"])(.*)\1$/, '$2');

/** Doc id (as used in sidebars) of a page at `file`, relative to its docs folder */
const docIdOf = (file, content) =>
  path.posix.join(
    path.posix.dirname(file),
    frontMatterValue(content, 'id') ??
      path.posix.basename(file).replace(MD, ''),
  );

/** Which frameworks a source page renders for (`frameworks: [react]`) */
function pageFrameworks(content) {
  const match = frontMatter(content).match(/^frameworks:\s*\[([^\]]*)\]\s*$/m);
  if (!match) return FRAMEWORKS;
  return match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
}

/** Apply `<framework>_<key>:` front matter overrides */
function rewriteFrontMatter(content, framework) {
  const fm = frontMatter(content);
  if (!fm) return content;
  const prefix = `${framework}_`;
  const key = l => l.split(':')[0];
  const lines = fm.split('\n');
  const overridden = new Set(
    lines
      .filter(l => l.startsWith(prefix))
      .map(l => key(l).slice(prefix.length)),
  );
  const next = lines
    .filter(l => !overridden.has(key(l)))
    .map(l => (l.startsWith(prefix) ? l.slice(prefix.length) : l));
  return content.replace(FM, `---\n${next.join('\n')}\n---\n`);
}

/** Map of output path -> source path (relative to docs/core) for a framework */
function resolveSources(framework) {
  const sources = new Map();
  for (const file of walk(SRC)) {
    if (VUE_OVERRIDE.test(file)) {
      if (framework === 'vue')
        sources.set(file.replace(VUE_OVERRIDE, '$1'), file);
    } else if (
      !sources.has(file) &&
      (!MD.test(file) || pageFrameworks(readSrc(file)).includes(framework))
    ) {
      sources.set(file, file);
    }
  }
  return sources;
}

/**
 * Docs that exist for a framework, by doc id (as used in sidebars):
 * - route: site route relative to the instance's routeBasePath, honoring `slug`
 * - equivalent: `framework_equivalent:` front matter, the doc id of the same
 *   concept in the other framework's docs when it has a different name
 */
function docsFor(framework) {
  const docs = new Map();
  for (const [out, src] of resolveSources(framework)) {
    if (!MD.test(out) || path.basename(out).startsWith('_')) continue;
    const content = rewriteFrontMatter(readSrc(src), framework);
    const id = docIdOf(out, content);
    docs.set(id, {
      route: getSlug({
        baseID: path.posix.basename(id),
        source: out,
        sourceDirName: path.posix.dirname(out),
        frontMatterSlug: frontMatterValue(content, 'slug'),
      }),
      equivalent: frontMatterValue(content, 'framework_equivalent'),
    });
  }
  return docs;
}

/**
 * `framework_equivalent:` front matter in both directions, for
 * FrameworkSelector: { [framework]: { [doc id]: counterpart's doc id } }
 */
function frameworkEquivalents() {
  const docs = Object.fromEntries(FRAMEWORKS.map(f => [f, docsFor(f)]));
  const equivalents = Object.fromEntries(FRAMEWORKS.map(f => [f, {}]));
  for (const framework of FRAMEWORKS) {
    for (const [id, { equivalent }] of docs[framework]) {
      if (!equivalent) continue;
      const others = FRAMEWORKS.filter(
        f => f !== framework && docs[f].has(equivalent),
      );
      if (!others.length)
        throw new Error(
          `${framework} doc ${id}: framework_equivalent '${equivalent}' is not a doc in any other framework`,
        );
      equivalents[framework][id] = equivalent;
      // reverse lookup, only needed when this framework has no `equivalent`
      if (docs[framework].has(equivalent)) continue;
      for (const other of others) {
        const existing = equivalents[other][equivalent];
        if (existing && existing !== id)
          throw new Error(
            `${other} doc ${equivalent} would switch to both ${existing} and ${id}; give it its own framework_equivalent`,
          );
        equivalents[other][equivalent] = id;
      }
    }
  }
  return equivalents;
}

/** Write the mirror for a framework; only touches files whose output changed */
function generate(framework) {
  // Sibling of docs/core so relative imports that leave the folder
  // (e.g. ../../rest/diagrams/...) still resolve from the mirror
  const outDir = path.resolve(__dirname, `../../docs/.core-${framework}`);
  const sources = resolveSources(framework);
  for (const [out, src] of sources) {
    const target = path.join(outDir, out);
    let content = fs.readFileSync(path.join(SRC, src));
    if (MD.test(out))
      content = Buffer.from(rewriteFrontMatter(content.toString(), framework));
    if (fs.existsSync(target) && fs.readFileSync(target).equals(content))
      continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  if (fs.existsSync(outDir)) {
    for (const file of walk(outDir)) {
      if (!sources.has(file)) fs.rmSync(path.join(outDir, file));
    }
  }
  /** Source of a mirror file (itself if not mirrored), for its git history */
  const sourceOf = file => {
    const src = sources.get(
      path.relative(outDir, file).split(path.sep).join('/'),
    );
    return src ? path.join(SRC, src) : file;
  };
  return { outDir, sources, sourceOf };
}

/** Keep the mirror in sync during `docusaurus start` */
function watch(framework) {
  let timer;
  fs.watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => generate(framework), 50);
  });
}

const SIDEBAR_OVERRIDE = new RegExp(`^(${FRAMEWORKS.join('|')})_(.+)$`);

/** Apply `<framework>_<key>` overrides to a sidebar item, like front matter */
function rewriteSidebarItem(item, framework) {
  // string shorthand ('introduction') has nothing to override
  if (typeof item !== 'object') return item;
  const next = {};
  const overrides = {};
  for (const [key, value] of Object.entries(item)) {
    const match = key.match(SIDEBAR_OVERRIDE);
    if (!match) next[key] = value;
    else if (match[1] === framework) overrides[match[2]] = value;
  }
  return { ...next, ...overrides };
}

/** Drop sidebar entries for docs that do not exist in this framework */
function filterSidebar(items, ids, framework) {
  return items.flatMap(raw => {
    const item = rewriteSidebarItem(raw, framework);
    if (item.type === 'doc') return ids.has(item.id) ? [item] : [];
    if (item.type !== 'category') return [item];
    const children = filterSidebar(item.items, ids, framework);
    return children.length ? [{ ...item, items: children }] : [];
  });
}

function sidebarsFor(framework, sidebars) {
  const ids = docsFor(framework);
  return Object.fromEntries(
    Object.entries(sidebars).map(([name, items]) => [
      name,
      filterSidebar(items, ids, framework),
    ]),
  );
}

/** Map a generated doc path back to its real source, for "Edit this page" */
function sourcePath(framework, docPath) {
  return resolveSources(framework).get(docPath) ?? docPath;
}

module.exports = {
  generate,
  watch,
  sidebarsFor,
  sourcePath,
  docsFor,
  frameworkEquivalents,
  docIdOf,
  pageFrameworks,
  rewriteFrontMatter,
  frontMatterValue,
};
