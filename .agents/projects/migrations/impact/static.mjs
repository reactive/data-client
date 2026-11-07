#!/usr/bin/env node
// Compares two checkouts of an app without running it: bundle size, LoC and decision-point
// complexity per code category, and how much hand-written data plumbing the app carries.
//
//   node static.mjs --config <app>/static.config.mjs --baseline <checkout> --migrated <checkout> \
//     [--build] [--out static.json]
//
// --build runs config.build (default `npx vite build`) in each root first; otherwise it reads
// the existing dist folder.
import { execSync } from 'node:child_process';
import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

import { loadConfig } from './utils/config.mjs';
import { metric } from './utils/metrics.mjs';

const { values: opt } = parseArgs({
  options: {
    config: { type: 'string' },
    baseline: { type: 'string' },
    migrated: { type: 'string' },
    build: { type: 'boolean', default: false },
    out: { type: 'string', default: 'static.json' },
  },
});
if (!opt.config || !opt.baseline || !opt.migrated) {
  console.error(
    'usage: static.mjs --config <static.config.mjs> --baseline <dir> --migrated <dir> [--build] [--out file]',
  );
  process.exit(2);
}
const config = await loadConfig(resolve(opt.config), 'static');

// Patterns that count hand-written data plumbing. Counted in code with comments removed.
export const PLUMBING = {
  useEffect: /\buse(Layout)?Effect\s*\(/g,
  useState: /\buse(State|Reducer)\s*\(/g,
  loadingFlags:
    /\b(is(Loading|Pending|Fetching|Refetching|Error|Success|Idle|Stale|Placeholder(Data)?)|loading|error)\b(?=\s*(\?|&&|\|\||\)|!|=)|\s*$)/gm,
  cacheCalls:
    /\.(invalidateQueries|refetchQueries|setQueryData|setQueriesData|getQueryData|removeQueries|resetQueries|cancelQueries|prefetchQuery|ensureQueryData|fetchQuery|refetch|mutate|mutateAsync|revalidate|invalidate|invalidateAll|expireAll|resetEntireStore|fetchIfStale|setResponse)\s*\(/g,
  cacheKeys: /\b(queryKey|mutationKey)\s*:/g,
  tryCatch: /\bcatch\s*[({]/g,
};

const stripComments = src =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function loadTs(root) {
  try {
    return createRequire(join(root, 'noop.js'))('typescript');
  } catch {
    return null;
  }
}

/** Decision points (McCabe without the +1 per function), from the TypeScript AST. */
function complexity(ts, file, src) {
  const sf = ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    false,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const K = ts.SyntaxKind;
  const decisions = new Set([
    K.IfStatement,
    K.ConditionalExpression,
    K.CaseClause,
    K.CatchClause,
    K.ForStatement,
    K.ForInStatement,
    K.ForOfStatement,
    K.WhileStatement,
    K.DoStatement,
  ]);
  const logical = new Set([
    K.AmpersandAmpersandToken,
    K.BarBarToken,
    K.QuestionQuestionToken,
  ]);
  let n = 0;
  const walk = node => {
    if (decisions.has(node.kind)) n++;
    else if (
      node.kind === K.BinaryExpression &&
      logical.has(node.operatorToken.kind)
    )
      n++;
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return n;
}

function categorize(rel) {
  for (const [name, globs] of config.categories ?? []) {
    if (globs.some(g => matchesGlob(rel, g))) return name;
  }
  return 'app';
}

function matchesGlob(rel, glob) {
  // path.matchesGlob is experimental in node 22; this covers **, * and {a,b}.
  const re = glob
    .replace(/[.+^$()|[\]\\]/g, '\\$&')
    .replace(/\{([^}]+)\}/g, (_, alts) => `(${alts.split(',').join('|')})`)
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*\*/g, '\u0001')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\u0000/g, '(.*/)?')
    .replace(/\u0001/g, '.*');
  return new RegExp(`^${re}$`).test(rel);
}

function scanSource(root) {
  const ts = loadTs(root);
  const files = [
    ...new Set(
      (config.include ?? ['src/**/*.{ts,tsx,js,jsx}']).flatMap(g =>
        globSync(g, { cwd: root }),
      ),
    ),
  ].filter(f => !f.includes('node_modules'));
  const cats = {};
  const importers = {};
  for (const rel of files) {
    const src = readFileSync(join(root, rel), 'utf8');
    const code = stripComments(src);
    const c = (cats[categorize(rel)] ??= {
      files: 0,
      loc: 0,
      complexity: 0,
      plumbing: {},
    });
    c.files++;
    c.loc += code.split('\n').filter(l => l.trim()).length;
    if (ts) c.complexity += complexity(ts, rel, src);
    for (const [k, re] of Object.entries(PLUMBING)) {
      c.plumbing[k] = (c.plumbing[k] ?? 0) + (code.match(re)?.length ?? 0);
    }
    for (const lib of config.dataLibs ?? []) {
      if (
        new RegExp(`from\\s+['"]${lib.replace(/[/.]/g, '\\$&')}`).test(code)
      ) {
        importers[lib] = (importers[lib] ?? 0) + 1;
      }
    }
  }
  return { cats, importers, complexityAvailable: !!ts };
}

function sizes(buf) {
  return {
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    brotli: brotliCompressSync(buf, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}
const add = (a, b) => ({
  raw: a.raw + b.raw,
  gzip: a.gzip + b.gzip,
  brotli: a.brotli + b.brotli,
});
const ZERO = { raw: 0, gzip: 0, brotli: 0 };

function scanBundle(root) {
  const dist = join(root, config.dist ?? 'dist');
  try {
    statSync(dist);
  } catch {
    return null;
  }
  const exclude = (config.bundleExclude ?? []).map(g => f => matchesGlob(f, g));
  const js = globSync('**/*.{js,mjs}', { cwd: dist }).filter(
    f => !exclude.some(x => x(f)),
  );
  const css = globSync('**/*.css', { cwd: dist });
  // Entry = scripts and modulepreloads the HTML loads before anything lazy.
  let entry = ZERO;
  const html = (() => {
    try {
      return readFileSync(join(dist, config.entryHtml ?? 'index.html'), 'utf8');
    } catch {
      return '';
    }
  })();
  const refs = [
    ...html.matchAll(/<(?:script[^>]+src|link[^>]+href)="\/?([^"]+\.m?js)"/g),
  ].map(m => m[1]);
  for (const r of new Set(refs)) {
    try {
      entry = add(entry, sizes(readFileSync(join(dist, r))));
    } catch {}
  }
  const total = js.reduce(
    (t, f) => add(t, sizes(readFileSync(join(dist, f)))),
    ZERO,
  );
  const cssTotal = css.reduce(
    (t, f) => add(t, sizes(readFileSync(join(dist, f)))),
    ZERO,
  );
  return { entry, total, css: cssTotal, chunks: js.length };
}

function variant(dir) {
  const root = resolve(dir, config.root ?? '.');
  if (opt.build)
    execSync(config.build ?? 'npx vite build', { cwd: root, stdio: 'inherit' });
  return {
    root: relative(process.cwd(), root),
    source: scanSource(root),
    bundle: scanBundle(root),
  };
}

const b = variant(opt.baseline);
const m = variant(opt.migrated);

const metrics = [];
const kb = x => x / 1024;
if (b.bundle && m.bundle) {
  for (const [part, label] of [
    ['entry', 'Entry JS'],
    ['total', 'All JS'],
    ['css', 'CSS'],
  ]) {
    for (const enc of ['gzip', 'brotli', 'raw']) {
      if (part === 'css' && enc !== 'gzip') continue;
      metrics.push(
        metric(
          'bundle',
          `${part}.${enc}`,
          `${label}, ${enc}`,
          'kB',
          kb(b.bundle[part][enc]),
          kb(m.bundle[part][enc]),
        ),
      );
    }
  }
}
const unmaintained = config.unmaintained ?? ['test', 'mock'];
const catNames = [
  ...new Set([...Object.keys(b.source.cats), ...Object.keys(m.source.cats)]),
];
const empty = { files: 0, loc: 0, complexity: 0, plumbing: {} };
for (const cat of catNames) {
  const cb = b.source.cats[cat] ?? empty;
  const cm = m.source.cats[cat] ?? empty;
  // Tests and mocks are not maintenance cost to minimize, so they get no verdict.
  const dir = { lowerIsBetter: unmaintained.includes(cat) ? null : true };
  metrics.push(
    metric('code', `${cat}.loc`, `${cat} LoC`, 'lines', cb.loc, cm.loc, dir),
  );
  metrics.push(
    metric(
      'code',
      `${cat}.files`,
      `${cat} files`,
      'files',
      cb.files,
      cm.files,
      dir,
    ),
  );
  if (b.source.complexityAvailable)
    metrics.push(
      metric(
        'code',
        `${cat}.complexity`,
        `${cat} decision points`,
        'count',
        cb.complexity,
        cm.complexity,
        dir,
      ),
    );
}
// Plumbing totals over hand-maintained code (everything except tests and mocks).
const maintained = cats =>
  Object.entries(cats).filter(([k]) => !unmaintained.includes(k));
for (const k of Object.keys(PLUMBING)) {
  const sum = cats =>
    maintained(cats).reduce((t, [, c]) => t + (c.plumbing[k] ?? 0), 0);
  metrics.push(
    metric('plumbing', k, k, 'count', sum(b.source.cats), sum(m.source.cats)),
  );
}
for (const lib of config.dataLibs ?? []) {
  metrics.push(
    metric(
      'plumbing',
      `imports.${lib}`,
      `files importing ${lib}`,
      'files',
      b.source.importers[lib] ?? 0,
      m.source.importers[lib] ?? 0,
      { lowerIsBetter: null },
    ),
  );
}

const result = {
  kind: 'static',
  app: config.name,
  date: new Date().toISOString(),
  metrics,
  raw: { baseline: b, migrated: m },
};
writeFileSync(opt.out, JSON.stringify(result, null, 1));
console.error(`wrote ${opt.out}`);
