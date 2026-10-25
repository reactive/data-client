/**
 * Which locales a pull request's preview builds. Each locale is a full build,
 * so a PR builds English plus only the locales its diff could change or
 * break; the merge queue and master always build every locale.
 *
 *   git diff --name-only --no-renames "$BASE" HEAD > changed
 *   git diff --name-only --no-renames --diff-filter=D "$BASE" HEAD > deleted
 *   node website/scripts/pick-locales.mjs changed deleted
 *
 * Prints the locales to build (`en es`), or nothing for every locale.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { DEFAULT_LOCALE, LOCALES } = require('../translate/locales.js');

const TRANSLATED = Object.keys(LOCALES);
/** Stands in for every locale when a change reaches them all alike: their
 * builds differ only in content, and this one also joins CJK lines */
const REPRESENTATIVE = 'zh-Hans';

/** Inputs every locale's build shares: the config, the generators of each
 * locale's docs and Vue mirror, and its remark plugins. Leaves out what only
 * translators and checks run (translate.mjs, its glossaries and tests, the
 * docs-example checks) and docs */
const sharesEveryLocale = file =>
  file === 'website/docusaurus.config.ts' ||
  (/^website\/(translate|framework-docs)\//.test(file) &&
    !/\.md$|\.test\.mjs$/.test(file) &&
    !/^website\/translate\/(translate|mdx)\.mjs$/.test(file) &&
    !/^website\/translate\/(glossary|lock)\//.test(file) &&
    !/^website\/framework-docs\/(check\w*|skillReferences)\.mjs$/.test(file));

/** A locale's own files: its translations and its lock (which marks the
 * pages whose English changed since) */
const localeOf = file =>
  file.match(/^website\/i18n\/([^/]+)\//)?.[1] ??
  file.match(/^website\/translate\/lock\/([^/]+)\.json$/)?.[1];

/** Name a translation would use to import or link a deleted doc, component
 * or static file (its folder's, for an index); null for other files */
const referenceName = file => {
  if (!/^(docs|website\/src|website\/static)\//.test(file)) return null;
  const { name, dir } = path.posix.parse(file);
  return name === 'index' ? path.posix.basename(dir) : name;
};

/** Locales whose translations or lock mention `name`, by path or content */
export function gitMentions(name) {
  const git = (...args) => {
    try {
      return execFileSync('git', args, { encoding: 'utf8' }).split('\n');
    } catch (error) {
      // git grep exits 1 when nothing matches
      if (error.status === 1) return [];
      throw error;
    }
  };
  const files = git(
    'grep',
    '-l',
    '-F',
    '-e',
    name,
    '--',
    'website/i18n',
    'website/translate/lock',
  );
  const paths = git('ls-files', '--', 'website/i18n').filter(file =>
    path.posix.basename(file).includes(name),
  );
  return new Set([...files, ...paths].map(localeOf).filter(Boolean));
}

/**
 * @param {string[]} changed repo-relative paths the PR changes
 * @param {string[]} deleted the ones it deletes or renames away
 * @param {(name: string) => Set<string>} mentions locales whose translations
 *   import or link `name`; a deleted file can break only those
 * @returns {string[] | null} locales to build, default first; null for every locale
 */
export function pickLocales(changed, deleted, mentions = gitMentions) {
  const touched = new Set(changed.map(localeOf).filter(Boolean));
  // a folder for a locale the config doesn't list yet
  if ([...touched].some(locale => !TRANSLATED.includes(locale))) return null;
  if (changed.some(sharesEveryLocale)) touched.add(REPRESENTATIVE);
  for (const name of deleted.map(referenceName)) {
    if (name) for (const locale of mentions(name)) touched.add(locale);
  }
  if (touched.size === TRANSLATED.length) return null;
  return [DEFAULT_LOCALE, ...TRANSLATED.filter(locale => touched.has(locale))];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lines = file => readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const [changed, deleted] = process.argv.slice(2).map(lines);
  console.log(pickLocales(changed, deleted)?.join(' ') ?? '');
}
