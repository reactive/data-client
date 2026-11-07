#!/usr/bin/env node
// One command for a full before/after impact report.
//
//   node measure.mjs --config <app>/impact.config.mjs --baseline <checkout> --migrated <checkout> \
//     [--runs 10] [--cpu 4] [--feature] [--feature-runs 3] [--no-build] [--out <dir>] \
//     [--baseline-label react-query] [--migrated-label data-client]
//
// 1. applies config.prep patches to each checkout (skipped when already applied)
// 2. builds both (config.build) unless --no-build
// 3. serves both (config.serve, {port} replaced) and runs flow.mjs against them
// 4. runs static.mjs, and feature-cost.mjs when --feature is given (it spends model tokens)
// 5. writes <out>/impact.json and <out>/impact.md with report.mjs
import { execFileSync, execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join, resolve } from 'node:path';
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
  if (!opt['no-build'] && config.build) {
    console.error(`${v}: ${config.build}`);
    execSync(config.build, { cwd: rootOf(v), stdio: 'inherit' });
  }
}

const waitForPort = async (port, ms = 60_000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
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
const ports = { baseline: 4310, migrated: 4311 };
try {
  for (const v of Object.keys(checkouts)) {
    const cmd = (
      config.serve ?? 'npx vite preview --port {port} --strictPort'
    ).replaceAll('{port}', ports[v]);
    servers.push(
      spawn('bash', ['-c', `exec ${cmd}`], {
        cwd: rootOf(v),
        stdio: 'ignore',
        detached: true,
      }),
    );
    await waitForPort(ports[v]);
    urls[v] = `http://localhost:${ports[v]}`;
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
    '--out',
    join(out, 'impact'),
    ...reports,
  ]);
} finally {
  for (const s of servers) {
    try {
      process.kill(-s.pid);
    } catch {}
  }
}
