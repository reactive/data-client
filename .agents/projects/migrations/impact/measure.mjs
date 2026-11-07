#!/usr/bin/env node
// One command for a full before/after impact report.
//
//   node measure.mjs --config <app>/impact.config.mjs --baseline <checkout> --migrated <checkout> \
//     [--runs 10] [--cpu 4] [--feature] [--feature-runs 3] [--no-build] [--out <dir>] \
//     [--baseline-label react-query] [--migrated-label data-client]
//
// 1. applies config.prep patches to each checkout (skipped when already applied)
// 2. builds both (config.build, default `npx vite build`) unless --no-build
// 3. serves both (config.serve, {port} replaced) and runs flow.mjs against them
// 4. runs static.mjs, and feature-cost.mjs when --feature is given (it spends model tokens)
// 5. writes <out>/impact.json and <out>/impact.md with report.mjs
import { execFileSync, execSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createConnection, createServer } from 'node:net';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
const { values: opt } = parseArgs({
  options: {
    config: { type: 'string' },
    baseline: { type: 'string' },
    migrated: { type: 'string' },
    runs: { type: 'string', default: '10' },
    cpu: { type: 'string', default: '4' },
    feature: { type: 'boolean', default: false },
    'feature-runs': { type: 'string', default: '3' },
    'no-build': { type: 'boolean', default: false },
    out: { type: 'string', default: 'impact-results' },
    'baseline-label': { type: 'string', default: 'Baseline' },
    'migrated-label': { type: 'string', default: 'Migrated' },
  },
});
if (!opt.config || !opt.baseline || !opt.migrated) {
  console.error(
    'usage: measure.mjs --config <impact.config.mjs> --baseline <checkout> --migrated <checkout> [--runs N] [--feature] [--out dir]',
  );
  process.exit(2);
}
const configPath = resolve(opt.config);
const config = (await import(pathToFileURL(configPath).href)).default;
const out = resolve(opt.out);
mkdirSync(out, { recursive: true });
const checkouts = {
  baseline: resolve(opt.baseline),
  migrated: resolve(opt.migrated),
};
const rootOf = v => join(checkouts[v], config.root ?? '.');
const node = (script, args) =>
  execFileSync(process.execPath, [join(here, script), ...args], {
    stdio: 'inherit',
    cwd: rootOf('baseline'),
  });

for (const v of Object.keys(checkouts)) {
  for (const patch of config.prep ?? []) {
    const p = resolve(dirname(configPath), patch);
    const git = args =>
      execFileSync('git', args, { cwd: checkouts[v], stdio: 'pipe' });
    try {
      git(['apply', '-R', '--check', p]);
      console.error(`${v}: ${patch} already applied`);
    } catch {
      git(['apply', p]);
      console.error(`${v}: applied ${patch}`);
    }
  }
  if (!opt['no-build']) {
    const build = config.build ?? 'npx vite build';
    console.error(`${v}: ${build}`);
    execSync(build, { cwd: rootOf(v), stdio: 'inherit' });
  }
}

// What was measured, so a committed report can be traced to exact commits and tools.
const sh = (cmd, cwd) => {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024 * 1024,
    }).trim();
  } catch {
    return null;
  }
};
// Fingerprint of the working tree on top of the commit (tracked diff plus untracked files), so two
// dirty trees can be told apart. null when the checkout is not a git repository.
function treeDiffSha1(cwd) {
  const diff = sh('git diff HEAD', cwd);
  if (diff === null) return null;
  const hash = createHash('sha1').update(diff);
  const untracked =
    sh('git ls-files -z --others --exclude-standard', cwd) ?? '';
  for (const f of untracked.split('\0').filter(Boolean).sort()) {
    // Path and content hashed separately, so a name/content boundary cannot shift.
    let contentDigest = '';
    try {
      contentDigest = createHash('sha1')
        .update(readFileSync(join(cwd, f)))
        .digest('hex');
    } catch {
      // Nested repository, dangling symlink or unreadable file: the path alone counts.
    }
    hash.update(`\0${f}\0${contentDigest}`);
  }
  return hash.digest('hex').slice(0, 12);
}
const meta = {
  config: relative(process.cwd(), configPath),
  prep: config.prep ?? [],
  runs: +opt.runs,
  cpuThrottle: +opt.cpu,
  node: process.version,
  playwright: sh(
    `node -p "require('playwright/package.json').version"`,
    rootOf('baseline'),
  ),
  checkouts: Object.fromEntries(
    Object.keys(checkouts).map(v => [
      v,
      {
        commit: sh('git rev-parse HEAD', checkouts[v]),
        treeDiffSha1: treeDiffSha1(checkouts[v]),
        // Prep patches and the migration itself usually show here; the count says how much.
        uncommittedFiles:
          sh('git status --porcelain', checkouts[v])
            ?.split('\n')
            .filter(Boolean).length ?? null,
      },
    ]),
  ),
};
writeFileSync(join(out, 'meta.json'), JSON.stringify(meta, null, 1));

const freePort = () =>
  new Promise((res, rej) => {
    const srv = createServer();
    srv.on('error', rej);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => res(port));
    });
  });

const waitForPort = async (port, child, ms = 60_000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Fail fast instead of measuring whatever else answers on this port.
    if (child.exitCode !== null)
      throw new Error(`server for port ${port} exited with ${child.exitCode}`);
    const ok = await new Promise(r => {
      const s = createConnection(port, '127.0.0.1', () => (s.end(), r(true)));
      s.on('error', () => r(false));
    });
    if (ok) return;
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`nothing listening on ${port} after ${ms}ms`);
};

const servers = [];
const urls = {};
const stopServers = () => {
  for (const s of servers) {
    try {
      process.kill(-s.pid);
    } catch {}
  }
};
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopServers();
    process.exit(130);
  });
}
try {
  for (const v of Object.keys(checkouts)) {
    const port = await freePort();
    const cmd = (
      config.serve ?? 'npx vite preview --port {port} --strictPort'
    ).replaceAll('{port}', port);
    const child = spawn('bash', ['-c', `exec ${cmd}`], {
      cwd: rootOf(v),
      stdio: 'ignore',
      detached: true,
    });
    servers.push(child);
    await waitForPort(port, child);
    urls[v] = `http://localhost:${port}`;
  }
  const reports = [];
  if (config.flow) {
    node('flow.mjs', [
      '--config',
      configPath,
      '--baseline',
      urls.baseline,
      '--migrated',
      urls.migrated,
      '--runs',
      opt.runs,
      '--cpu',
      opt.cpu,
      '--out',
      join(out, 'flow.json'),
    ]);
    reports.push(join(out, 'flow.json'));
  }
  if (config.static) {
    node('static.mjs', [
      '--config',
      configPath,
      '--baseline',
      checkouts.baseline,
      '--migrated',
      checkouts.migrated,
      '--out',
      join(out, 'static.json'),
    ]);
    reports.push(join(out, 'static.json'));
  }
  if (opt.feature && config.feature) {
    node('feature-cost.mjs', [
      '--config',
      configPath,
      '--baseline',
      checkouts.baseline,
      '--migrated',
      checkouts.migrated,
      '--runs',
      opt['feature-runs'],
      '--out',
      join(out, 'feature.json'),
    ]);
    reports.push(join(out, 'feature.json'));
  }
  node('report.mjs', [
    '--title',
    `${config.name}: impact report`,
    '--baseline-label',
    opt['baseline-label'],
    '--migrated-label',
    opt['migrated-label'],
    '--meta',
    join(out, 'meta.json'),
    '--out',
    join(out, 'impact'),
    ...reports,
  ]);
} finally {
  stopServers();
}
