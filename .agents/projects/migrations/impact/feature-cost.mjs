#!/usr/bin/env node
// Tokens per feature: gives a coding agent the same feature request on a copy of each checkout,
// then records its token use, cost, turns and time, checks the result with a hidden acceptance
// test, and measures the size of the change.
//
//   node feature-cost.mjs --config <app>/feature.config.mjs --baseline <checkout> --migrated <checkout> \
//     [--runs 3] [--model sonnet] [--effort medium] [--keep] [--out feature.json]
//
// The agent runs in a temporary copy with edits auto-accepted and only the tools in
// config.allowedTools (default: file tools plus type-check and unit-test commands).
// node_modules folders are symlinked, never copied or reinstalled.
import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  globSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { sampled } from './utils/metrics.mjs';
import { loadConfig } from './utils/config.mjs';
import { compare } from './utils/stats.mjs';

const { values: opt } = parseArgs({
  options: {
    config: { type: 'string' },
    baseline: { type: 'string' },
    migrated: { type: 'string' },
    runs: { type: 'string', default: '3' },
    model: { type: 'string', default: 'sonnet' },
    effort: { type: 'string', default: 'medium' },
    keep: { type: 'boolean', default: false },
    out: { type: 'string', default: 'feature.json' },
  },
});
if (!opt.config || !opt.baseline || !opt.migrated) {
  console.error(
    'usage: feature-cost.mjs --config <feature.config.mjs> --baseline <dir> --migrated <dir> [--runs N] [--model m] [--effort e]',
  );
  process.exit(2);
}
const configPath = resolve(opt.config);
const config = await loadConfig(configPath, 'feature');
const configDir = dirname(configPath);
const SKIP = new Set([
  'node_modules',
  '.git',
  ...(config.copyExclude ?? ['dist', 'playwright-report', 'test-results']),
]);
const ALLOWED_TOOLS = config.allowedTools ?? [
  'Read',
  'Edit',
  'Write',
  'Glob',
  'Grep',
  'TodoWrite',
  'Bash(npx tsc:*)',
  'Bash(npx vitest:*)',
  'Bash(npm test:*)',
  'Bash(ls:*)',
  'Bash(cat:*)',
  'Bash(grep:*)',
];

function copyCheckout(src) {
  const dest = mkdtempSync(join(tmpdir(), `impact-${basename(src)}-`));
  cpSync(src, dest, { recursive: true, filter: p => !SKIP.has(basename(p)) });
  // Reuse installed dependencies.
  for (const nm of globSync('**/node_modules', {
    cwd: src,
    exclude: p =>
      String(p.parentPath ? `${p.parentPath}/${p.name}` : p).includes(
        'node_modules/',
      ),
  })) {
    if (!existsSync(join(dest, nm)))
      symlinkSync(join(resolve(src), nm), join(dest, nm), 'dir');
  }
  const git = (...a) => execFileSync('git', a, { cwd: dest, stdio: 'pipe' });
  git('init', '-q');
  git('add', '-A');
  git(
    '-c',
    'user.email=impact@local',
    '-c',
    'user.name=impact',
    'commit',
    '-qm',
    'start',
    '--no-verify',
  );
  return dest;
}

function runAgent(cwd) {
  const args = [
    '-p',
    config.prompt,
    '--output-format',
    'json',
    '--model',
    opt.model,
    '--effort',
    opt.effort,
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    ...ALLOWED_TOOLS,
  ];
  const t0 = Date.now();
  const r = spawnSync('claude', args, {
    cwd,
    input: '',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: (config.timeoutMin ?? 40) * 60_000,
  });
  let out = {};
  try {
    out = JSON.parse(r.stdout);
  } catch {
    out = { is_error: true, result: (r.stderr || r.stdout || '').slice(-2000) };
  }
  // Sum across every model the session used (subagents included).
  const models = Object.values(out.modelUsage ?? {});
  const sum = k => models.reduce((t, m) => t + (m[k] ?? 0), 0);
  return {
    ok: !out.is_error,
    wallMs: Date.now() - t0,
    turns: out.num_turns,
    costUsd: out.total_cost_usd,
    inputTokens: sum('inputTokens'),
    cacheWriteTokens: sum('cacheCreationInputTokens'),
    cacheReadTokens: sum('cacheReadInputTokens'),
    outputTokens: sum('outputTokens'),
    permissionDenials: out.permission_denials?.length ?? 0,
    result: String(out.result ?? '').slice(0, 2000),
  };
}

function diffSize(cwd) {
  execFileSync('git', ['add', '-A'], { cwd });
  const numstat = execFileSync(
    'git',
    ['diff', '--cached', '--numstat', 'HEAD'],
    { cwd, encoding: 'utf8' },
  );
  let added = 0;
  let removed = 0;
  let files = 0;
  const ignore = config.diffIgnore ?? [/lock(\.json|\.yaml)?$/, /\.lock$/];
  for (const line of numstat.trim().split('\n').filter(Boolean)) {
    const [a, r, f] = line.split('\t');
    if (ignore.some(re => re.test(f))) continue;
    files++;
    added += +a || 0;
    removed += +r || 0;
  }
  return {
    linesChanged: added + removed,
    linesAdded: added,
    filesChanged: files,
  };
}

function accept(cwd) {
  const root = join(cwd, config.root ?? '.');
  // Hidden from the agent until now, so it cannot code to the test.
  for (const [dest, src] of Object.entries(config.acceptanceFiles ?? {})) {
    writeFileSync(join(root, dest), readFileSync(resolve(configDir, src)));
  }
  const r = spawnSync('bash', ['-c', config.acceptance], {
    cwd: root,
    encoding: 'utf8',
    timeout: 15 * 60_000,
  });
  return {
    pass: r.status === 0 ? 1 : 0,
    log: ((r.stdout ?? '') + (r.stderr ?? '')).slice(-3000),
  };
}

const variants = {
  baseline: resolve(opt.baseline),
  migrated: resolve(opt.migrated),
};
const samples = {};
const runsLog = [];
for (let i = 0; i < +opt.runs; i++) {
  for (const variant of i % 2 ?
    ['migrated', 'baseline']
  : ['baseline', 'migrated']) {
    const cwd = copyCheckout(variants[variant]);
    process.stderr.write(`run ${i + 1}/${opt.runs} ${variant} in ${cwd}\n`);
    const agent = runAgent(cwd);
    const diff = diffSize(cwd);
    const acc = accept(cwd);
    const totalTokens =
      agent.inputTokens +
      agent.cacheWriteTokens +
      agent.cacheReadTokens +
      agent.outputTokens;
    const m = { ...agent, ...diff, pass: acc.pass, totalTokens };
    for (const [k, v] of Object.entries(m)) {
      if (typeof v !== 'number') continue;
      (samples[k] ??= { baseline: [], migrated: [] })[variant].push(v);
    }
    runsLog.push({
      variant,
      run: i + 1,
      dir: opt.keep ? cwd : undefined,
      ...m,
      acceptanceLog: acc.log,
    });
    process.stderr.write(
      `  pass=${acc.pass} tokens=${totalTokens} cost=$${agent.costUsd?.toFixed(2)} turns=${agent.turns} lines=${diff.linesChanged}\n`,
    );
    if (!opt.keep) rmSync(cwd, { recursive: true, force: true });
  }
}

const ROWS = [
  ['totalTokens', 'Tokens, all (input + cache + output)', 'tokens', true],
  ['outputTokens', 'Output tokens', 'tokens', true],
  ['costUsd', 'Cost', 'USD', true],
  ['turns', 'Agent turns', 'turns', true],
  ['wallMs', 'Wall time', 'ms', true],
  ['linesChanged', 'Lines changed (excl. lockfiles)', 'lines', true],
  ['filesChanged', 'Files changed', 'files', true],
  ['pass', 'Acceptance passed (1 = yes)', 'median of runs', false],
];
const metrics = ROWS.filter(([k]) => samples[k]).map(
  ([k, label, unit, lower]) =>
    sampled(
      'feature cost',
      k,
      label,
      unit,
      compare(samples[k].baseline, samples[k].migrated, {
        lowerIsBetter: lower,
      }),
      { lowerIsBetter: lower },
    ),
);
writeFileSync(
  opt.out,
  JSON.stringify(
    {
      kind: 'feature',
      app: config.name,
      feature: config.title,
      model: opt.model,
      effort: opt.effort,
      date: new Date().toISOString(),
      metrics,
      runs: runsLog,
    },
    null,
    1,
  ),
);
console.error(`wrote ${opt.out}`);
