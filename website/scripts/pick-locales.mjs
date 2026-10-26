/**
 * Which locales a pull request's preview builds. Each locale is a full build,
 * so a PR builds English, the locales whose own files it changes, one
 * translated locale when it changes an input every locale shares, and the
 * locales whose translations name a file it deletes. Anything else that
 * breaks only a translation fails in the merge queue, which (like master)
 * builds every locale.
 *
 *   node website/scripts/pick-locales.mjs <base-sha>
 *
 * Prints the locales to build (`en es`), or nothing for every locale.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { git } from '../framework-docs/site.mjs';

const require = createRequire(import.meta.url);
const { DEFAULT_LOCALE, LOCALES } = require('../translate/locales.js');

const TRANSLATED = Object.keys(LOCALES);
/** Stands in for every locale when a change reaches them all alike: their
 * builds differ only in content, and this one also joins CJK lines */
const REPRESENTATIVE = 'zh-Hans';

/** Inputs every locale's build shares: the config and the plugins beside
 * it, the generators of each locale's docs and Vue mirror, and its remark
 * plugins. Leaves out what only translators and checks run (translate.mjs,
 * its glossaries and tests, the docs-example checks) and docs */
const sharesEveryLocale = file =>
  /^website\/(?:[^/]+\.(?:[cm]?js|ts)$|(?:translate|framework-docs)\/)/.test(
    file,
  ) &&
  !/\.md$|\.test\.mjs$/.test(file) &&
  !/^website\/translate\/(translate|mdx)\.mjs$/.test(file) &&
  !/^website\/translate\/(glossary|lock)\//.test(file) &&
  !/^website\/framework-docs\/(check\w*|skillReferences)\.mjs$/.test(file);

/** A locale's own files: its translations and its lock (which marks the
 * pages whose English changed since). Keep in sync with translationOf() and
 * lockFile() in translate/localeDocs.js */
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

/** Lines of a git command's output; none when git grep matches nothing */
const gitLines = (...args) => {
  try {
    return git(...args)
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }
};

/** Locales whose translations or lock mention any of `names`: as a whole
 * word in their content, or as a file or folder name in their path */
export function gitMentions(names) {
  const files = gitLines(
    'grep',
    '-l',
    '-F',
    '-w',
    ...names.flatMap(name => ['-e', name]),
    '--',
    'website/i18n',
    'website/translate/lock',
  );
  const paths = gitLines('ls-files', '--', 'website/i18n').filter(file => {
    const { dir, name } = path.posix.parse(file);
    return [...dir.split('/'), name].some(part => names.includes(part));
  });
  return new Set([...files, ...paths].map(localeOf).filter(Boolean));
}

/**
 * @param {string[]} changed repo-relative paths the PR changes
 * @param {string[]} deleted the ones it deletes or renames away
 * @param {(names: string[]) => Set<string>} mentions locales whose
 *   translations import or link any of `names`; a deleted file can break only those
 * @returns {string[] | null} locales to build, default first; null for every locale
 */
export function pickLocales(changed, deleted, mentions = gitMentions) {
  const touched = new Set(changed.map(localeOf).filter(Boolean));
  // a folder for a locale the config doesn't list yet
  if ([...touched].some(locale => !TRANSLATED.includes(locale))) return null;
  if (changed.some(sharesEveryLocale)) touched.add(REPRESENTATIVE);
  const names = deleted.map(referenceName).filter(Boolean);
  if (names.length) for (const locale of mentions(names)) touched.add(locale);
  if (touched.size === TRANSLATED.length) return null;
  return [DEFAULT_LOCALE, ...TRANSLATED.filter(locale => touched.has(locale))];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const status = gitLines(
    'diff',
    '--name-status',
    '--no-renames',
    process.argv[2],
    'HEAD',
  ).map(line => line.split('\t'));
  const changed = status.map(([, file]) => file);
  const deleted = status
    .filter(([kind]) => kind === 'D')
    .map(([, file]) => file);
  console.log(pickLocales(changed, deleted)?.join(' ') ?? '');
}
