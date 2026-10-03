/* global require, module, __dirname, Buffer */
/**
 * Single-source framework docs.
 *
 * `docs/core` is the one source of truth. React renders it directly at /docs.
 * Vue renders a generated mirror (docs/.core-vue, gitignored) at /docs/vue,
 * which Docusaurus needs because two docs instances cannot share one folder.
 *
 * Authoring conventions (see website/framework-docs/README.md):
 * - `:::react` / `:::vue` blocks and `:react[...]` / `:vue[...]` inline text
 *   (resolved by ./remarkFramework.js per instance)
 * - `frameworks: [react]` front matter: page only exists for that framework
 * - `vue_<key>:` front matter overrides `<key>:` for Vue (e.g. vue_title)
 * - `foo.vue.md` replaces `foo.md` for Vue; use only when nearly nothing
 *   is shareable, or for Vue-only pages
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../docs/core');
// Sibling of docs/core so relative imports that leave the folder
// (e.g. ../../rest/diagrams/...) still resolve from the mirror
const outDirFor = framework =>
  path.resolve(__dirname, `../../docs/.core-${framework}`);
const FRAMEWORKS = ['react', 'vue'];
const MD = /\.mdx?$/;
const OVERRIDE = /\.(react|vue)(\.mdx?)$/;

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, base);
    return [path.relative(base, full)];
  });
}

const FM = /^---\n([\s\S]*?)\n---\n/;

function readFrontMatter(content) {
  const match = content.match(FM);
  return match ? match[1] : '';
}

/** Which frameworks a source page renders for */
function pageFrameworks(content) {
  const fm = readFrontMatter(content);
  const match = fm.match(/^frameworks:\s*\[([^\]]*)\]\s*$/m);
  if (!match) return FRAMEWORKS;
  return match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
}

/** Apply `<framework>_<key>:` front matter overrides */
function rewriteFrontMatter(content, framework) {
  const fm = readFrontMatter(content);
  if (!fm) return content;
  const lines = fm.split('\n');
  const prefix = `${framework}_`;
  const overridden = new Set(
    lines
      .filter(l => l.startsWith(prefix))
      .map(l => l.slice(prefix.length).split(':')[0]),
  );
  const next = lines
    .filter(l => !overridden.has(l.split(':')[0]))
    .map(l => (l.startsWith(prefix) ? l.slice(prefix.length) : l));
  return content.replace(FM, `---\n${next.join('\n')}\n---\n`);
}

/** Resolve which source file supplies each output path for a framework */
function resolveSources(framework) {
  const files = walk(SRC);
  const sources = new Map();
  // shared files first, then overrides win
  for (const file of files) {
    if (OVERRIDE.test(file)) continue;
    if (MD.test(file)) {
      const content = fs.readFileSync(path.join(SRC, file), 'utf8');
      if (!pageFrameworks(content).includes(framework)) continue;
    }
    sources.set(file, file);
  }
  for (const file of files) {
    const match = file.match(OVERRIDE);
    if (!match || match[1] !== framework) continue;
    sources.set(file.replace(OVERRIDE, '$2'), file);
  }
  return sources;
}

/** Doc ids (as used in sidebars) that exist for a framework */
function docIds(framework) {
  const ids = new Set();
  for (const [out, src] of resolveSources(framework)) {
    if (!MD.test(out) || path.basename(out).startsWith('_')) continue;
    const content = fs.readFileSync(path.join(SRC, src), 'utf8');
    const fm = rewriteFrontMatter(content, framework);
    const id = readFrontMatter(fm).match(/^id:\s*(\S+)\s*$/m);
    const dir = path.dirname(out);
    const name = id ? id[1] : path.basename(out).replace(MD, '');
    ids.add(dir === '.' ? name : `${dir}/${name}`);
  }
  return ids;
}

/** Write the mirror for a framework; only touches files whose output changed */
function generate(framework) {
  const outDir = outDirFor(framework);
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
  return { outDir, sources };
}

/** Keep the mirror in sync during `docusaurus start` */
function watch(framework) {
  let timer;
  fs.watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => generate(framework), 50);
  });
}

/** Drop sidebar entries for docs that do not exist in this framework */
function filterSidebar(items, ids) {
  return items.flatMap(item => {
    if (typeof item === 'string') return ids.has(item) ? [item] : [];
    if (item.type === 'doc') return ids.has(item.id) ? [item] : [];
    if (item.type === 'category') {
      const children = filterSidebar(item.items, ids);
      return children.length ? [{ ...item, items: children }] : [];
    }
    return [item];
  });
}

function sidebarsFor(framework, sidebars) {
  const ids = docIds(framework);
  return Object.fromEntries(
    Object.entries(sidebars).map(([name, items]) => [
      name,
      filterSidebar(items, ids),
    ]),
  );
}

/** Map a generated doc path back to its real source, for "Edit this page" */
function sourcePath(framework, docPath) {
  return resolveSources(framework).get(docPath) ?? docPath;
}

module.exports = {
  SRC,
  FRAMEWORKS,
  generate,
  watch,
  sidebarsFor,
  sourcePath,
  docIds,
  rewriteFrontMatter,
};
