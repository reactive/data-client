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
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { DEFAULT_LOCALE, LOCALES } = require('./locales.js');
const {
  DOCS_INSTANCES,
  localizedPath,
} = require('../framework-docs/docsInstances.js');
const { FM, walk } = require('../framework-docs/index.js');

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

/** Partials (`_x.mdx`) are parts of pages, not pages */
const isPartial = file => MD.test(file) && path.posix.basename(file)[0] === '_';
/** English copy of a translated partial, for pages rendered in English */
const englishCopy = file => file.replace(MD, '.en$&');

/**
 * Points imports of `file` (as rendered in `locale`) where they resolve: those
 * leaving its docs folder at the locale's copy of that folder, and, when the
 * page renders in `english`, translated partials at their English copy
 */
function retarget(content, file, locale, english) {
  const lines = content.split('\n');
  for (const { i, specifier } of relativeImports(content)) {
    let target = importTarget(file, specifier);
    if (
      english &&
      isPartial(target) &&
      fs.existsSync(path.join(ROOT, translationOf(target, locale)))
    )
      target = englishCopy(target);
    else if (instanceOf(target) === instanceOf(file)) continue;
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

/** Where `translate.mjs finalize` records the English each translation matches */
const lockFile = locale => path.join(__dirname, 'lock', `${locale}.json`);

/** Git's blob id of `content` (as `git hash-object` computes it) */
const blobId = content =>
  crypto
    .createHash('sha1')
    .update(`blob ${content.length}\0`)
    .update(content)
    .digest('hex');

/** Puts `block` right under a page's front matter */
function underFrontMatter(content, block) {
  const [frontMatter = ''] = FM.exec(content) ?? [];
  return `${frontMatter}\n${block}\n\n${content.slice(frontMatter.length)}`;
}

/**
 * Marks a page rendered in English: search engines index the English URL
 * instead, and screen readers read it as English
 */
const ENGLISH_PAGE = `<head>
  <html lang="${DEFAULT_LOCALE}" />
  <meta name="robots" content="noindex" />
</head>`;

/**
 * Generates a locale's docs folders. A translated page whose English changed
 * since it was finalized says so until the next translation pass; an
 * untranslated page is marked as English. Returns `sourceOf`, mapping a generated
 * file to the committed file it came from (for git history).
 */
function generate(locale) {
  const sources = new Map();
  const lock =
    fs.existsSync(lockFile(locale)) ?
      JSON.parse(fs.readFileSync(lockFile(locale), 'utf8')).docs
    : {};
  for (const instance of SOURCE_INSTANCES) {
    const outDir = path.join(ROOT, localizedPath(instance.id, locale));
    const files = walk(path.join(ROOT, instance.path));
    const written = new Set();
    const write = (name, content, from) => {
      const out = path.join(outDir, name);
      writeIfChanged(out, content);
      sources.set(out, path.join(ROOT, from));
      written.add(name);
    };
    for (const name of files) {
      const file = `${instance.path}/${name}`;
      const translation = translationOf(file, locale);
      const translated = fs.existsSync(path.join(ROOT, translation));
      const from = translated ? translation : file;
      const content = fs.readFileSync(path.join(ROOT, from));
      if (!MD.test(name)) {
        write(name, content, from);
        continue;
      }
      let text = retarget(content.toString(), file, locale, !translated);
      const english = fs.readFileSync(path.join(ROOT, file));
      if (translated && isPartial(file))
        write(
          englishCopy(name),
          Buffer.from(retarget(english.toString(), file, locale, true)),
          file,
        );
      if (!translated) {
        if (!isPartial(file)) text = underFrontMatter(text, ENGLISH_PAGE);
      } else if (lock[file] !== blobId(english)) {
        // in a partial, it shows where the partial is imported
        text = underFrontMatter(
          text,
          `:::note\n\n${LOCALES[locale].outdated}\n\n:::`,
        );
      }
      write(name, Buffer.from(text), from);
    }
    if (fs.existsSync(outDir))
      for (const name of walk(outDir))
        if (!written.has(name)) fs.rmSync(path.join(outDir, name));
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
  const watched = [
    ...SOURCE_INSTANCES.map(d => [d.path]),
    // the locale's folder, which may not have translations yet; but not the
    // folders generated in it
    [translationOf('', locale), name => name.startsWith('docs')],
    [path.relative(ROOT, path.dirname(lockFile(locale)))],
  ];
  for (const [dir, filter = () => true] of watched) {
    const full = path.join(ROOT, dir);
    fs.mkdirSync(full, { recursive: true });
    fs.watch(full, { recursive: true }, (_, name) => {
      if (name && filter(name)) regenerate();
    });
  }
}

module.exports = {
  SOURCE_INSTANCES,
  instanceOf,
  translationOf,
  lockFile,
  proseLines,
  relativeImports,
  importTarget,
  generate,
  watch,
};
