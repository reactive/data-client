#!/usr/bin/env node
/**
 * Keeps the docs translations in website/i18n in sync with the English docs.
 * How it works and how to run it: ./README.md
 *
 *   node website/translate/translate.mjs [--locale es] [--model id] [--dry-run]
 *     [--force] [--skip-ui] [--out-dir dir] [docs/core/some-page.md ...]
 */
import { writeTranslations as docusaurusWriteTranslations } from '@docusaurus/core/lib/index.js';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { complete } from './llm.mjs';
import {
  TranslationError,
  pinHeadingIds,
  protectCode,
  relativeImports,
  restoreCode,
  rewriteImports,
  structureProblems,
  unescape,
} from './mdx.mjs';
import {
  extractTranslation,
  messagesPrompt,
  retryPrompt,
  systemPrompt,
  translatePrompt,
  updatePrompt,
} from './prompt.mjs';
import { ROOT } from '../framework-docs/site.mjs';

const require = createRequire(import.meta.url);
const { DEFAULT_LOCALE, LOCALES } = require('./locales.js');
const {
  DOCS_INSTANCES,
  localizedPath,
} = require('../framework-docs/docsInstances.js');
const { walk } = require('../framework-docs/index.js');

const DEFAULT_MODEL = 'claude-sonnet-5-5';
const WEBSITE = path.join(ROOT, 'website');
const MD = /\.mdx?$/;
/** Pages Docusaurus doesn't publish (docusaurus.config.ts `exclude`) */
const UNPUBLISHED = ['docs/core/getting-started/README.md'];

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    locale: { type: 'string', multiple: true },
    model: {
      type: 'string',
      default: process.env.TRANSLATE_MODEL ?? DEFAULT_MODEL,
    },
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    'skip-ui': { type: 'boolean', default: false },
    'out-dir': { type: 'string' },
    concurrency: { type: 'string', default: '4' },
  },
});

/** Docs instances with their own source folder (Vue mirrors docs/core) */
const SOURCE_INSTANCES = DOCS_INSTANCES.filter(
  (d, i, all) => all.findIndex(other => other.path === d.path) === i,
);
const instanceOf = file =>
  SOURCE_INSTANCES.find(d => file.startsWith(`${d.path}/`));

/** Repo-relative source pages, and the partials they import */
const SOURCES = SOURCE_INSTANCES.flatMap(d =>
  walk(path.join(ROOT, d.path))
    .filter(
      file =>
        MD.test(file) &&
        !file
          .split('/')
          .slice(0, -1)
          .some(dir => dir.startsWith('_')),
    )
    .map(file => `${d.path}/${file}`),
).filter(file => !UNPUBLISHED.includes(file));

const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const git = (...args) =>
  execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  });
/** Git blob id of each file's current content */
const blobsOf = files =>
  Object.fromEntries(
    git('hash-object', '--', ...files.map(f => path.join(ROOT, f)))
      .trim()
      .split('\n')
      .map((blob, i) => [files[i], blob]),
  );
/** A source as it was when translated (from git), if git still has it */
function sourceAt(blob) {
  try {
    return git('cat-file', 'blob', blob);
  } catch {
    return undefined;
  }
}

/** Where a locale's translation of a source page lives (repo-relative) */
function localeFile(file, locale) {
  const instance = instanceOf(file);
  return path.posix.join(
    localizedPath(instance.id, locale),
    file.slice(instance.path.length + 1),
  );
}

/** Source file a relative import of `file` points at (repo-relative) */
const importTarget = (file, specifier) =>
  path.posix.normalize(
    path.posix.join(path.posix.dirname(file), unescape(specifier)),
  );

/**
 * Pages in a locale's scope, plus the partials they import from their own
 * docs instance: a translated page's `../shared/_x.mdx` resolves next to it,
 * so those come along. Cross-instance imports point at whatever exists
 * (see `resolveImport`).
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
    file => !scope || scope.some(prefix => file.startsWith(prefix)),
  ).forEach(add);
  return wanted;
}

/**
 * New specifier for a source import of `file`, as seen from its translation:
 * the target's translation when there is one, else the English file
 */
function resolveImport(file, specifier, locale) {
  const target = importTarget(file, specifier);
  const localized =
    instanceOf(target) && MD.test(target) ?
      localeFile(target, locale)
    : undefined;
  const to =
    localized && fs.existsSync(path.join(ROOT, localized)) ? localized : target;
  const relative = path.posix.relative(
    path.posix.dirname(localeFile(file, locale)),
    to,
  );
  const next = relative.startsWith('.') ? relative : `./${relative}`;
  // an import that still resolves keeps the English spelling
  return next === path.posix.normalize(unescape(specifier)) ? specifier : next;
}

const lockFile = locale =>
  path.join(WEBSITE, 'translate', 'lock', `${locale}.json`);
const readLock = locale =>
  fs.existsSync(lockFile(locale)) ?
    JSON.parse(fs.readFileSync(lockFile(locale), 'utf8'))
  : { docs: {}, ui: {} };
const sortKeys = object =>
  Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );
function writeLock(locale, lock) {
  fs.mkdirSync(path.dirname(lockFile(locale)), { recursive: true });
  fs.writeFileSync(
    lockFile(locale),
    `${JSON.stringify({ docs: sortKeys(lock.docs), ui: sortKeys(lock.ui) }, null, 2)}\n`,
  );
}

const usage = { input: 0, output: 0 };

/** One model turn, returning the translation inside its reply */
async function ask(system, messages) {
  const reply = await complete({ model: options.model, system, messages });
  usage.input += reply.usage.input;
  usage.output += reply.usage.output;
  messages.push({ role: 'assistant', content: reply.text });
  return extractTranslation(reply.text);
}

/**
 * Translates `file`, or updates its existing translation when the lock knows
 * the English it came from. Retries once with the structural problems.
 */
async function translateFile(file, { locale, system, lock }) {
  const source = read(file);
  const protectedSource = protectCode(source);
  const out = localeFile(file, locale);
  const previous = lock.docs[file] && fs.existsSync(path.join(ROOT, out));
  const previousSource = previous && sourceAt(lock.docs[file].source);
  const prompt =
    previousSource ?
      updatePrompt({
        previousSource: protectCode(previousSource).text,
        source: protectedSource.text,
        // with the imports as the English had them (before `finalize`)
        previousTranslation: protectCode(
          rewriteImports(read(out), previousSource, specifier => specifier),
        ).text,
      })
    : translatePrompt({ source: protectedSource.text });
  const messages = [{ role: 'user', content: prompt }];
  for (let attempt = 1; ; attempt++) {
    try {
      const translated = restoreCode(
        await ask(system, messages),
        protectedSource.text,
        protectedSource.blocks,
      );
      const problems = structureProblems(
        source,
        translated,
        path.join(ROOT, file),
      );
      if (problems.length) throw new TranslationError(problems);
      return pinHeadingIds(translated, source);
    } catch (error) {
      if (!(error instanceof TranslationError) || attempt === 2) throw error;
      messages.push({ role: 'user', content: retryPrompt(error.problems) });
    }
  }
}

/** Points a translation's relative imports at what exists now */
function finalize(file, locale, source) {
  const out = path.join(ROOT, localeFile(file, locale));
  const content = fs.readFileSync(out, 'utf8');
  const next = rewriteImports(content, source, specifier =>
    resolveImport(file, specifier, locale),
  );
  if (next !== content) fs.writeFileSync(out, next);
}

/** Runs `work` over `items`, `limit` at a time */
async function pool(items, limit, work) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await work(queue.shift());
    }),
  );
}

async function syncDocs(locale) {
  const lock = readLock(locale);
  const outDir = options['out-dir'];
  const wanted = outDir ? new Set(positionals) : wantedSources(locale);
  const blobs = blobsOf([...wanted]);

  const orphans =
    outDir ? [] : Object.keys(lock.docs).filter(file => !wanted.has(file));
  const todo = [...wanted].filter(
    file =>
      (!positionals.length || positionals.includes(file)) &&
      (outDir ||
        options.force ||
        lock.docs[file]?.source !== blobs[file] ||
        !fs.existsSync(path.join(ROOT, localeFile(file, locale)))),
  );
  console.log(
    `${locale}: ${wanted.size} pages, ${todo.length} to translate, ${orphans.length} to remove`,
  );
  for (const file of todo)
    console.log(`  ${lock.docs[file] ? 'update' : 'new'}: ${file}`);
  if (options['dry-run']) return true;

  const system = systemPrompt({ locale, language: LOCALES[locale].language });
  let ok = true;
  await pool(todo, Number(options.concurrency), async file => {
    try {
      const translated = await translateFile(file, { locale, system, lock });
      const out =
        outDir ?
          path.join(outDir, file)
        : path.join(ROOT, localeFile(file, locale));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, translated);
      if (outDir) return;
      lock.docs[file] = { source: blobs[file], model: options.model };
      writeLock(locale, lock);
      console.log(`  ✓ ${file}`);
    } catch (error) {
      ok = false;
      console.error(`  ✗ ${file}: ${error.message}`);
    }
  });
  if (outDir) return ok;

  for (const file of orphans) {
    fs.rmSync(path.join(ROOT, localeFile(file, locale)), { force: true });
    delete lock.docs[file];
  }
  // imports follow whichever partials are translated now
  for (const [file, { source }] of Object.entries(lock.docs)) {
    const english = source === blobs[file] ? read(file) : sourceAt(source);
    if (english) finalize(file, locale, english);
  }
  writeLock(locale, lock);
  return ok;
}

/** Docusaurus' UI strings (navbar, footer, sidebar labels) for a locale */
async function writeTranslations(locale, override = false) {
  // the CLI's `write-translations` writes the same files but never exits
  await docusaurusWriteTranslations(WEBSITE, { locale, override });
  const dir = path.join(WEBSITE, 'i18n', locale);
  return Object.fromEntries(
    walk(dir)
      .filter(file => file.endsWith('.json'))
      .map(file => [
        file,
        JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')),
      ]),
  );
}

async function syncUI(locale) {
  const lock = readLock(locale);
  const english = await writeTranslations(DEFAULT_LOCALE, true);
  fs.rmSync(path.join(WEBSITE, 'i18n', DEFAULT_LOCALE), { recursive: true });
  const localized = await writeTranslations(locale);

  const todo = {};
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
      target[key] = { message, description };
      todo[`${file}#${key}`] = message;
    }
  }
  console.log(`${locale}: ${Object.keys(todo).length} UI strings to translate`);
  let ok = true;
  let translated = {};
  if (Object.keys(todo).length) {
    const system = systemPrompt({ locale, language: LOCALES[locale].language });
    try {
      translated = JSON.parse(
        await ask(system, [{ role: 'user', content: messagesPrompt(todo) }]),
      );
    } catch (error) {
      ok = false;
      console.error(`  ✗ UI strings: ${error.message}`);
    }
  }
  // untranslated strings stay English, and unlocked, until a later run
  for (const [id, message] of Object.entries(todo)) {
    const placeholders = s => (s.match(/\{\w+\}/g) ?? []).sort().join();
    const text = translated[id];
    if (
      typeof text !== 'string' ||
      placeholders(text) !== placeholders(message)
    ) {
      if (Object.keys(translated).length) {
        ok = false;
        console.error(`  ✗ ${id}: bad translation ${JSON.stringify(text)}`);
      }
      continue;
    }
    const [file, key] = [
      id.slice(0, id.indexOf('#')),
      id.slice(id.indexOf('#') + 1),
    ];
    localized[file][key].message = text;
    lock.ui[file][key] = message;
  }
  for (const [file, messages] of Object.entries(localized)) {
    if (!english[file]) continue;
    fs.writeFileSync(
      path.join(WEBSITE, 'i18n', locale, file),
      `${JSON.stringify(messages, null, 2)}\n`,
    );
  }
  writeLock(locale, lock);
  return ok;
}

const locales = options.locale ?? Object.keys(LOCALES);
let ok = true;
for (const locale of locales) {
  if (!LOCALES[locale])
    throw new Error(`Unknown locale ${locale}; see locales.js`);
  ok = (await syncDocs(locale)) && ok;
  if (
    !options['dry-run'] &&
    !options['skip-ui'] &&
    !options['out-dir'] &&
    !positionals.length
  )
    ok = (await syncUI(locale)) && ok;
}
console.log(
  `tokens: ${usage.input} in, ${usage.output} out (${options.model})`,
);
if (!ok) process.exitCode = 1;
