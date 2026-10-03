/* global require, module, __dirname, Buffer */
/**
 * Single-source framework docs (authoring conventions in ./README.md).
 *
 * `docs/core` is rendered directly for React at /docs. Vue renders a generated
 * mirror (docs/.core-vue, gitignored) at /docs/vue, because two docs instances
 * cannot share one folder.
 */
const fs = require('fs');
const path = require('path');

const { FRAMEWORKS } = require('./remarkFramework.js');

const SRC = path.resolve(__dirname, '../../docs/core');
const MD = /\.mdx?$/;
/** `foo.vue.md` replaces `foo.md` for Vue */
const VUE_OVERRIDE = /\.vue(\.mdx?)$/;
const FM = /^---\n([\s\S]*?)\n---\n/;

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, base);
    return [path.relative(base, full)];
  });
}

const readSrc = file => fs.readFileSync(path.join(SRC, file), 'utf8');
const frontMatter = content => content.match(FM)?.[1] ?? '';

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

/** Doc ids (as used in sidebars) that exist for a framework */
function docIds(framework) {
  const ids = new Set();
  for (const [out, src] of resolveSources(framework)) {
    if (!MD.test(out) || path.basename(out).startsWith('_')) continue;
    const id = frontMatter(readSrc(src)).match(/^id:\s*(\S+)\s*$/m);
    const name = id ? id[1] : path.basename(out).replace(MD, '');
    ids.add(path.posix.join(path.dirname(out), name));
  }
  return ids;
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

module.exports = { generate, watch, sidebarsFor, sourcePath };
