#!/usr/bin/env node
// One command for a full before/after impact report.
//
//   node measure.mjs --config <app>/impact.config.mjs --baseline <checkout> --migrated <checkout> \
//     [--runs 10] [--cpu 4] [--latency 400,100,1500] [--feature] [--feature-runs 3] [--no-build] \
//     [--out <dir>] [--baseline-label react-query] [--migrated-label data-client]
//
// 1. applies config.prep patches to each checkout (skipped when already applied)
// 2. for each mock API latency (config.latency.profiles or --latency; the first is the primary):
//    builds both with config.latency.env set (config.build, default `npx vite build`) unless
//    --no-build, serves both (config.serve, {port} replaced) and runs flow.mjs against them
// 3. runs static.mjs, and feature-cost.mjs when --feature is given (it spends model tokens)
// 4. writes <out>/impact.json and <out>/impact.md with report.mjs
import { execFileSync, execSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
    latency: { type: 'string' },
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
// Mock API latencies in ms. The first is the primary run behind every table; the others repeat the
// flow for the latency sweep. [undefined] when the config has no latency section: one run, env untouched.
const profiles =
  opt.latency ?
    opt.latency.split(',').map(Number)
  : (config.latency?.profiles ?? [undefined]);
if (profiles[0] !== undefined && !config.latency?.env) {
  console.error(
    '--latency needs config.latency.env, the variable the app reads its mock delay from',
  );
  process.exit(2);
}
if (profiles.length > 1 && opt['no-build']) {
  console.error(
    'a latency sweep rebuilds for each latency; drop --no-build or pass one --latency',
  );
  process.exit(2);
}
const envFor = ms =>
  ms === undefined ?
    process.env
  : { ...process.env, [config.latency.env]: String(ms) };
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
}
const build = ms => {
  if (opt['no-build']) return;
  const cmd = config.build ?? 'npx vite build';
  for (const v of Object.keys(checkouts)) {
    console.error(
      `${v}: ${cmd}${ms === undefined ? '' : ` (${config.latency.env}=${ms})`}`,
    );
    execSync(cmd, { cwd: rootOf(v), stdio: 'inherit', env: envFor(ms) });
  }
};

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
// Resolves each library the way the build does, walking up from the app root, and records its
// version; a copy found above the checkout (a parent project's install) is labeled as such.
// A configured library that resolves nowhere is recorded as null.
function installedVersions(root, checkout, libs) {
  const inside = dir => !relative(resolve(checkout), dir).startsWith('..');
  const versions = {};
  for (const lib of libs) {
    versions[lib] = null;
    for (let dir = resolve(root); ; dir = dirname(dir)) {
      const pkg = join(dir, 'node_modules', lib, 'package.json');
      if (existsSync(pkg)) {
        const { version } = JSON.parse(readFileSync(pkg, 'utf8'));
        versions[lib] =
          inside(dir) ? version : `${version} (outside the checkout)`;
        break;
      }
      if (dirname(dir) === dir) break;
    }
  }
  return versions;
}
const meta = {
  config: relative(process.cwd(), configPath),
  prep: config.prep ?? [],
  latency:
    profiles[0] === undefined ?
      null
    : { env: config.latency.env, profilesMs: profiles },
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
        // Installed versions of the data libraries the config names, so results say what they measured.
        dataLibs: installedVersions(
          rootOf(v),
          checkouts[v],
          config.static?.dataLibs ?? [],
        ),
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

let servers = [];
const stopServers = () => {
  for (const s of servers) {
    try {
      process.kill(-s.pid);
    } catch {}
  }
  servers = [];
};
async function serveBoth(ms) {
  const urls = {};
  for (const v of Object.keys(checkouts)) {
    const port = await freePort();
    const cmd = (
      config.serve ?? 'npx vite preview --port {port} --strictPort'
    ).replaceAll('{port}', port);
    const child = spawn('bash', ['-c', `exec ${cmd}`], {
      cwd: rootOf(v),
      stdio: 'ignore',
      detached: true,
      env: envFor(ms),
    });
    servers.push(child);
    await waitForPort(port, child);
    urls[v] = `http://localhost:${port}`;
  }
  return urls;
}
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopServers();
    process.exit(130);
  });
}
try {
  const flows = [];
  // The primary latency goes last, so the dist folder static.mjs reads is its build.
  for (const ms of [...profiles.slice(1), profiles[0]]) {
    build(ms);
    if (!config.flow) continue;
    const file = join(
      out,
      ms === profiles[0] ? 'flow.json' : `flow-${ms}ms.json`,
    );
    const urls = await serveBoth(ms);
    try {
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
        file,
        ...(ms === undefined ? [] : ['--latency-ms', String(ms)]),
      ]);
    } finally {
      stopServers();
    }
    flows.push(file);
  }
  // report.mjs treats the first flow file as the primary run.
  const reports = flows.reverse();
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
