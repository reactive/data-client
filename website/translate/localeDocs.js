/* global require, module, __dirname, Buffer */
/**
 * The docs folders Docusaurus renders for a locale (gitignored), generated
 * at config load: every English source file, with the locale's translation
 * in its place where there is one.
 *
 * Translations are committed repo-shaped (`website/i18n/es/docs/core/x.md`
 * translates `docs/core/x.md`) and keep the English page's imports and links.
 * Because each generated folder is complete, those resolve as written; only
 * imports leaving their docs folder (`../../rest/diagrams/...`) are pointed
 * at the other folder's generated copy.
 */
const fs = require('fs');
const path = require('path');

const {
  DOCS_INSTANCES,
  localizedPath,
} = require('../framework-docs/docsInstances.js');
const { walk } = require('../framework-docs/index.js');

const ROOT = path.resolve(__dirname, '../..');
const MD = /\.mdx?$/;
const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;
/** Line of an import/export naming its module (`} from` ends multi-line ones) */
const IMPORT =
  /^((?:import|export)\s(?:.*?\sfrom\s+)?|\}\s*from\s+)(['"])(\.\.?\/[^'"]+)\2/;

/** Docs instances with their own source folder (Vue mirrors docs/core) */
const SOURCE_INSTANCES = DOCS_INSTANCES.filter(
  (d, i, all) => all.findIndex(other => other.path === d.path) === i,
);
/** Instance whose source folder holds `file` (repo-relative) */
const instanceOf = file =>
  SOURCE_INSTANCES.find(d => file.startsWith(`${d.path}/`));

/** Where a locale's translation of a source file is committed (repo-relative) */
const translationOf = (file, locale) =>
  path.posix.join('website/i18n', locale, file);

/** Line ranges [start, end] of fenced code blocks */
function fences(lines) {
  const blocks = [];
  let open;
  lines.forEach((line, i) => {
    const match = FENCE.exec(line);
    if (!open) {
      // ``` with a backtick in its info string is inline code, not a fence
      if (match && !(match[2][0] === '`' && match[3].includes('`')))
        open = { start: i, char: match[2][0], length: match[2].length };
    } else if (
      match &&
      match[2][0] === open.char &&
      match[2].length >= open.length &&
      !match[3].trim()
    ) {
      blocks.push([open.start, i]);
      open = undefined;
    }
  });
  if (open) blocks.push([open.start, lines.length - 1]);
  return blocks;
}

/** Lines outside fenced code, with their index */
function proseLines(content) {
  const lines = content.split('\n');
  const inCode = new Set();
  for (const [start, end] of fences(lines))
    for (let i = start; i <= end; i++) inCode.add(i);
  return lines
    .map((line, i) => ({ line, i }))
    .filter(({ i }) => !inCode.has(i));
}

/** MDX escapes `_` in paths (`\_partial.mdx`) */
const unescape = specifier => specifier.replace(/\\(.)/g, '$1');

/** Relative specifiers of `import ... from './x'` lines (outside code), with their line index */
function relativeImports(content) {
  return proseLines(content).flatMap(({ line, i }) => {
    const match = IMPORT.exec(line);
    return match ? [{ i, specifier: match[3] }] : [];
  });
}

/** Repo-relative file a relative import of `file` points at */
const importTarget = (file, specifier) =>
  path.posix.normalize(
    path.posix.join(path.posix.dirname(file), unescape(specifier)),
  );

/** Folder Docusaurus renders a source file from in `locale` */
const renderedAt = (file, locale) => {
  const instance = instanceOf(file);
  if (!instance) return file;
  return path.posix.join(
    localizedPath(instance.id, locale),
    file.slice(instance.path.length + 1),
  );
};

/** Points imports that leave `file`'s docs folder at the locale's copy */
function retarget(content, file, locale) {
  const lines = content.split('\n');
  for (const { i, specifier } of relativeImports(content)) {
    const target = importTarget(file, specifier);
    if (instanceOf(target) === instanceOf(file)) continue;
    let next = path.posix.relative(
      path.posix.dirname(renderedAt(file, locale)),
      renderedAt(target, locale),
    );
    if (!next.startsWith('.')) next = `./${next}`;
    lines[i] = lines[i].replace(
      IMPORT,
      (_, start, quote) => `${start}${quote}${next}${quote}`,
    );
  }
  return lines.join('\n');
}

/** Writes `content` to `file` unless it already has it */
function writeIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file).equals(content)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/**
 * Generates a locale's docs folders. Returns `sourceOf`, mapping a generated
 * file to the committed file it came from (for git history).
 */
function generate(locale) {
  const sources = new Map();
  for (const instance of SOURCE_INSTANCES) {
    const outDir = path.join(ROOT, localizedPath(instance.id, locale));
    const files = new Set(walk(path.join(ROOT, instance.path)));
    for (const name of files) {
      const file = `${instance.path}/${name}`;
      const translation = translationOf(file, locale);
      const from =
        fs.existsSync(path.join(ROOT, translation)) ? translation : file;
      let content = fs.readFileSync(path.join(ROOT, from));
      if (MD.test(name))
        content = Buffer.from(retarget(content.toString(), file, locale));
      const out = path.join(outDir, name);
      writeIfChanged(out, content);
      sources.set(out, path.join(ROOT, from));
    }
    for (const name of walk(outDir))
      if (!files.has(name)) fs.rmSync(path.join(outDir, name));
  }
  return { sourceOf: file => sources.get(file) ?? file };
}

/**
 * Regenerates a locale's docs when English or its translations change, then
 * calls `then` (for folders generated from these)
 */
function watch(locale, then = () => {}) {
  let timer;
  const regenerate = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      generate(locale);
      then();
    }, 50);
  };
  for (const dir of [
    ...SOURCE_INSTANCES.map(d => d.path),
    translationOf('docs', locale),
  ]) {
    const full = path.join(ROOT, dir);
    if (fs.existsSync(full)) fs.watch(full, { recursive: true }, regenerate);
  }
}

module.exports = {
  SOURCE_INSTANCES,
  instanceOf,
  translationOf,
  proseLines,
  relativeImports,
  importTarget,
  generate,
  watch,
};
