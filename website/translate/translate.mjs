#!/usr/bin/env node
/**
 * Keeps the docs translations in sync with the English docs, whoever (or
 * whatever) writes them. How it works: ./README.md
 *
 *   node website/translate/translate.mjs prepare [--locale es] [--json]
 *   node website/translate/translate.mjs finalize [--locale es] [--same <id>] [files...]
 *   node website/translate/translate.mjs check [--locale es]
 */
import { writeTranslations } from '@docusaurus/core/lib/index.js';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';

import {
  TranslationError,
  mdxProblems,
  pinHeadingIds,
  structureProblems,
} from './mdx.mjs';
import { ROOT, git } from '../framework-docs/site.mjs';

const require = createRequire(import.meta.url);
const { GlobExcludeDefault, createMatcher } = require('@docusaurus/utils');

const {
  SOURCE_INSTANCES,
  importTarget,
  instanceOf,
  lockFile,
  readLock,
  relativeImports,
  translationOf,
} = require('./localeDocs.js');
const { DEFAULT_LOCALE, LOCALES } = require('./locales.js');
const { DOCS_INSTANCES } = require('../framework-docs/docsInstances.js');
const { MD, walk } = require('../framework-docs/index.js');

const WEBSITE = path.join(ROOT, 'website');

const {
  values: options,
  positionals: [command, ...files],
} = parseArgs({
  allowPositionals: true,
  options: {
    locale: { type: 'string', multiple: true },
    json: { type: 'boolean', default: false },
    same: { type: 'string', multiple: true, default: [] },
  },
});

/** Repo-relative markdown sources, partials included */
const SOURCES = SOURCE_INSTANCES.flatMap(d =>
  walk(path.join(ROOT, d.path))
    .filter(file => MD.test(file))
    .map(file => `${d.path}/${file}`),
);
/** Each instance's unpublished files, as its docs plugin excludes them */
const EXCLUDED = DOCS_INSTANCES.map(d => ({
  dir: `${d.path}/`,
  excluded: createMatcher([...GlobExcludeDefault, ...(d.exclude ?? [])]),
}));
/** Whether some docs instance publishes a source as a page */
const published = file =>
  EXCLUDED.some(
    ({ dir, excluded }) =>
      file.startsWith(dir) && !excluded(file.slice(dir.length)),
  );

const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = file => fs.existsSync(path.join(ROOT, file));
/** Git blob id of each file's content (stored, so it can be read back) */
const blobsOf = paths =>
  paths.length ?
    Object.fromEntries(
      git('hash-object', '-w', '--', ...paths)
        .trim()
        .split('\n')
        .map((id, i) => [paths[i], id]),
    )
  : {};
/** Content of a blob, if git has it (a shallow clone may not) */
function blob(id) {
  try {
    return git('cat-file', 'blob', id);
  } catch {
    return undefined;
  }
}
const prefetched = new Set();
/** A partial clone (CI's blobless checkout) would fetch each blob as blob()
 * reads it; fetch them in one round trip instead. Elsewhere `git config`
 * throws. */
function prefetch(ids) {
  // locales mostly share the English they were checked against
  ids = ids.filter(id => !prefetched.has(id));
  if (!ids.length) return;
  for (const id of ids) prefetched.add(id);
  try {
    git('config', '--get', 'remote.origin.promisor');
    git('fetch', '-q', '--no-tags', '--no-write-fetch-head', 'origin', ...ids);
  } catch {
    // blob() fetches them one by one
  }
}
const hasBlob = id => {
  try {
    git('cat-file', '-e', id);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sources a locale translates: its pages (locales.js), and the partials they
 * import from their own docs folder, so imported sections are translated too
 */
function wantedSources(locale) {
  const scope = LOCALES[locale].pages;
  const wanted = new Set();
  const add = file => {
    if (wanted.has(file) || !SOURCES.includes(file)) return;
    wanted.add(file);
    for (const { specifier } of relativeImports(read(file))) {
      const target = importTarget(file, specifier);
      if (MD.test(target) && instanceOf(target) === instanceOf(file))
        add(target);
    }
  };
  SOURCES.filter(
    file =>
      published(file) &&
      (!scope || scope.some(prefix => file.startsWith(prefix))),
  ).forEach(add);
  return wanted;
}

/** Sources a locale has a translation of */
const translated = locale =>
  SOURCE_INSTANCES.flatMap(d => {
    const dir = path.join(ROOT, translationOf(d.path, locale));
    return fs.existsSync(dir) ?
        walk(dir)
          .filter(file => MD.test(file))
          .map(file => `${d.path}/${file}`)
      : [];
  });
/** Folder of a locale's committed translations, with a trailing slash */
const localeDir = locale => `${translationOf('', locale)}/`;
const sortKeys = object =>
  Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );
function writeLock(locale, lock) {
  for (const file of Object.keys(lock.ui))
    if (!Object.keys(lock.ui[file]).length) delete lock.ui[file];
  fs.mkdirSync(path.dirname(lockFile(locale)), { recursive: true });
  fs.writeFileSync(
    lockFile(locale),
    `${JSON.stringify({ docs: sortKeys(lock.docs), ui: sortKeys(lock.ui) }, null, 2)}\n`,
  );
}

/** A locale's Docusaurus UI string files (navbar, footer, sidebars), by path */
function uiFiles(locale) {
  const dir = path.join(WEBSITE, 'i18n', locale);
  if (!fs.existsSync(dir)) return {};
  return Object.fromEntries(
    walk(dir)
      // not the docs: translations, and the folders generated from them
      .filter(file => file.endsWith('.json') && file.split('/').length <= 2)
      .map(file => [
        file,
        JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')),
      ]),
  );
}
/** Id of a UI string in prepare's work list and finalize's `--same` */
const uiId = (locale, file, key) => `website/i18n/${locale}/${file}#${key}`;
/** Placeholders a UI string uses; a plural's forms ("1 item|{count} items")
 * repeat them, and a language can have fewer forms than English */
const placeholders = text => [...new Set(text.match(/\{\w+\}/g))].sort().join();

/** What's wrong with a UI string's translation, if anything: blank, lost
 * placeholders, a "|" in a string that isn't plural, or plural forms
 * ("|"-separated, as usePluralForm reads them) the locale can't use.
 * Docusaurus falls back to the last form, so too few forms would silently
 * show a plural for one. */
function uiProblem(locale, text, message) {
  if (!text.trim()) return 'translate it: it is blank';
  if (placeholders(text) !== placeholders(message))
    return `keep the placeholders of "${message}"`;
  const english = message.split('|').length;
  const forms = text.split('|').length;
  if (english === 1)
    return forms === 1 ? undefined : 'drop the "|": this string is not plural';
  const most = new Intl.PluralRules(locale).resolvedOptions().pluralCategories
    .length;
  const least = Math.min(english, most);
  if (forms >= least && forms <= most) return;
  return most === 1 ?
      'give one form with no "|": the language has no plural forms'
    : `give ${least === most ? least : `${least} to ${most}`} plural forms separated by "|", like "${message}"`;
}

/**
 * Writes a locale's UI string files, keeping its translations. Like the CLI's
 * `write-translations`, which never exits; without its [INFO] lines (stdout)
 */
async function writeUIFiles(locale, override = false) {
  const { log, info } = console;
  console.log = console.info = () => {};
  try {
    await writeTranslations(WEBSITE, { locale, override });
  } finally {
    Object.assign(console, { log, info });
  }
}

/** English UI strings, as Docusaurus extracts them */
async function englishUI() {
  await writeUIFiles(DEFAULT_LOCALE, true);
  const english = uiFiles(DEFAULT_LOCALE);
  fs.rmSync(path.join(WEBSITE, 'i18n', DEFAULT_LOCALE), { recursive: true });
  return english;
}

/**
 * Removes translations the locale no longer wants, adds new UI strings (in
 * English) to its files, and lists the pages and UI strings to translate
 */
async function prepare(locale, english) {
  const lock = readLock(locale);
  const wanted = wantedSources(locale);
  // e.g. after `pages` in locales.js narrowed, or an English page was deleted
  const removed = translated(locale)
    .filter(file => !wanted.has(file))
    .map(file => translationOf(file, locale));
  for (const file of removed) fs.rmSync(path.join(ROOT, file));
  for (const file of Object.keys(lock.docs))
    if (!wanted.has(file)) delete lock.docs[file];

  const blobs = blobsOf([...wanted]);
  const pages = [...wanted]
    .filter(
      file =>
        lock.docs[file] !== blobs[file] || !exists(translationOf(file, locale)),
    )
    .map(file => {
      const translation = translationOf(file, locale);
      const update = exists(translation);
      const previous = update && lock.docs[file];
      return {
        source: file,
        translation,
        status: update ? 'update' : 'new',
        // what changed in English since the translation was finalized
        ...(previous &&
          hasBlob(previous) && { diff: `git diff ${previous} ${blobs[file]}` }),
      };
    });

  await writeUIFiles(locale);
  const localized = uiFiles(locale);
  const ui = [];
  for (const [file, messages] of Object.entries(english)) {
    const target = (localized[file] ??= {});
    const done = (lock.ui[file] ??= {});
    for (const key of Object.keys(target))
      if (!(key in messages)) delete target[key];
    for (const key of Object.keys(done))
      if (!(key in messages)) delete done[key];
    for (const [key, { message, description }] of Object.entries(messages)) {
      if (done[key] === message && target[key]) continue;
      // Docusaurus ships translations of its theme's own strings
      if (!(key in done) && target[key] && target[key].message !== message) {
        done[key] = message;
        continue;
      }
      // a translation of older English shows English until it is redone
      const previous = key in done ? target[key]?.message : undefined;
      target[key] = { message, description };
      ui.push({
        id: uiId(locale, file, key),
        message,
        description,
        ...(previous !== undefined && { previous }),
      });
    }
    fs.writeFileSync(
      path.join(WEBSITE, 'i18n', locale, file),
      `${JSON.stringify(target, null, 2)}\n`,
    );
  }
  writeLock(locale, lock);
  return {
    locale,
    language: LOCALES[locale].language,
    glossary: `website/translate/glossary/${locale}.md`,
    pages,
    ui,
    removed,
  };
}

/** Sources whose translation git sees as changed or new */
function changedTranslations(locale) {
  const prefix = localeDir(locale);
  const entries = git('status', '--porcelain', '-uall', '-z', '--', prefix)
    .split('\0')
    .filter(Boolean);
  const changed = [];
  for (let i = 0; i < entries.length; i++) {
    const [status, file] = [entries[i].slice(0, 2), entries[i].slice(3)];
    // a rename or copy is followed by the path it came from
    if (/[RC]/.test(status)) i++;
    if (!status.includes('D') && file.startsWith(prefix) && MD.test(file))
      changed.push(file.slice(prefix.length));
  }
  return changed;
}

/** Source of a `finalize` argument (a source or a translation path) */
function sourceArg(file, locale) {
  const relative = path
    .relative(ROOT, path.resolve(file))
    .split(path.sep)
    .join('/');
  const prefix = localeDir(locale);
  return relative.startsWith(prefix) ? relative.slice(prefix.length) : relative;
}

/** Structure problems of a translation versus the English it translates */
function translationProblems(english, content, file) {
  try {
    const problems = structureProblems(english, content, path.join(ROOT, file));
    if (problems.length) return { problems };
    return { problems: [], pinned: pinHeadingIds(content, english) };
  } catch (error) {
    if (!(error instanceof TranslationError)) throw error;
    return { problems: error.problems };
  }
}

/**
 * Accepts translations written since `prepare`: checks each changed page
 * against its English, pins its heading anchors and records the English it
 * now translates; then records UI strings that were translated
 */
async function finalize(locale, english) {
  const lock = readLock(locale);
  const wanted = wantedSources(locale);
  const pages =
    files.length ?
      files.map(file => sourceArg(file, locale))
    : [
        ...new Set([
          ...changedTranslations(locale),
          // committed before being finalized
          ...translated(locale).filter(file => !(file in lock.docs)),
        ]),
      ];
  const blobs = blobsOf(pages.filter(file => wanted.has(file)));
  const accepted = [];
  const problems = [];
  for (const file of pages) {
    const translation = translationOf(file, locale);
    if (!wanted.has(file)) {
      problems.push(`${translation}: not a page ${locale} translates`);
      continue;
    }
    if (!exists(translation)) continue;
    const content = read(translation);
    const result = translationProblems(read(file), content, file);
    problems.push(...result.problems.map(p => `${translation}: ${p}`));
    if (result.problems.length) continue;
    if (result.pinned !== content)
      fs.writeFileSync(path.join(ROOT, translation), result.pinned);
    lock.docs[file] = blobs[file];
    accepted.push(translation);
  }

  const localized = uiFiles(locale);
  const untranslated = [];
  for (const [file, messages] of Object.entries(english)) {
    const done = (lock.ui[file] ??= {});
    for (const [key, { message }] of Object.entries(messages)) {
      const text = localized[file]?.[key]?.message;
      if (done[key] === message || typeof text !== 'string') continue;
      const id = uiId(locale, file, key);
      if (text === message && !options.same.includes(id)) {
        untranslated.push(id);
        continue;
      }
      const problem = uiProblem(locale, text, message);
      if (problem) problems.push(`${id}: ${problem}`);
      else {
        done[key] = message;
        accepted.push(id);
      }
    }
  }
  writeLock(locale, lock);
  return { accepted, untranslated, problems };
}

/**
 * Read-only consistency check (CI): every translation is finalized, against
 * English that is a page of its locale, and still has that English's structure
 */
function check(locale) {
  const lock = readLock(locale);
  const wanted = wantedSources(locale);
  const present = new Set(translated(locale));
  const current = blobsOf([...present].filter(file => wanted.has(file)));
  const problems = [];
  let stale = 0;
  let unverified = 0;
  /** English changed since this translation was checked against it */
  const behind = (file, id) => file in current && id !== current[file];
  prefetch(
    Object.entries(lock.docs)
      .filter(([file, id]) => behind(file, id))
      .map(([, id]) => id),
  );
  for (const file of present)
    if (!(file in lock.docs))
      problems.push(`${translationOf(file, locale)}: not finalized`);
  for (const [file, id] of Object.entries(lock.docs)) {
    const translation = translationOf(file, locale);
    if (!present.has(file)) {
      problems.push(`${translation}: in the lock but missing`);
      continue;
    }
    if (!wanted.has(file)) {
      problems.push(`${translation}: not a page ${locale} translates`);
      continue;
    }
    const english = behind(file, id) ? blob(id) : read(file);
    const content = read(translation);
    if (english === undefined) {
      // a shallow clone lacks it; still make sure the page compiles
      unverified++;
      problems.push(
        ...mdxProblems(content, path.join(ROOT, file)).map(
          p => `${translation}: ${p}`,
        ),
      );
      continue;
    }
    if (behind(file, id)) stale++;
    const result = translationProblems(english, content, file);
    if (!result.problems.length && result.pinned !== content)
      result.problems.push('headings lack their English anchors');
    problems.push(...result.problems.map(p => `${translation}: ${p}`));
  }
  const localized = uiFiles(locale);
  for (const [file, keys] of Object.entries(lock.ui))
    for (const [key, message] of Object.entries(keys)) {
      const text = localized[file]?.[key]?.message;
      const problem =
        typeof text === 'string' ? uiProblem(locale, text, message) : 'missing';
      if (problem) problems.push(`${uiId(locale, file, key)}: ${problem}`);
    }
  return { pages: present.size, stale, unverified, problems };
}

if (!['prepare', 'finalize', 'check'].includes(command))
  throw new Error('Usage: translate.mjs prepare|finalize|check (README.md)');
const locales = options.locale ?? Object.keys(LOCALES);
for (const locale of locales)
  if (!LOCALES[locale])
    throw new Error(`Unknown locale ${locale}; see translate/locales.js`);

let failed = false;
const english = command === 'check' ? undefined : await englishUI();
const work = [];
for (const locale of locales) {
  if (command === 'prepare') {
    const result = await prepare(locale, english);
    work.push(result);
    if (options.json) continue;
    console.log(
      `${locale}: ${result.pages.length} pages and ${result.ui.length} UI strings to translate into ${result.language}`,
    );
    for (const page of result.pages)
      console.log(
        `  ${page.status}: ${page.translation}${page.diff ? ` (${page.diff})` : ''}`,
      );
    for (const { id } of result.ui) console.log(`  ui: ${id}`);
    for (const file of result.removed)
      console.log(`  removed (no longer translated): ${file}`);
  } else if (command === 'finalize') {
    const result = await finalize(locale, english);
    console.log(`${locale}: ${result.accepted.length} accepted`);
    for (const id of result.accepted) console.log(`  ✓ ${id}`);
    for (const id of result.untranslated)
      console.log(`  still English (if intended: --same ${id})`);
    for (const problem of result.problems) console.error(`  ✗ ${problem}`);
    failed ||= result.problems.length > 0;
  } else {
    const result = check(locale);
    console.log(
      `${locale}: ${result.pages} pages, ${result.stale} behind English${result.unverified ? `, ${result.unverified} unverified (English not in this clone)` : ''}`,
    );
    for (const problem of result.problems) console.error(`  ✗ ${problem}`);
    failed ||= result.problems.length > 0;
  }
}
if (options.json) console.log(JSON.stringify(work, null, 2));
if (failed) process.exitCode = 1;
