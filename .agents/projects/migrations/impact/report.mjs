#!/usr/bin/env node
// Merges flow.json, static.json and feature.json (any subset) into impact.json and a markdown report.
//
//   node report.mjs [--title "..."] [--baseline-label react-query] [--migrated-label data-client] \
//     [--out impact] flow.json static.json feature.json
//
// Writes <out>.json (all rows, one schema) and <out>.md (tables per group).
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: opt, positionals: files } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: 'string' },
    'baseline-label': { type: 'string', default: 'Baseline' },
    'migrated-label': { type: 'string', default: 'Migrated' },
    out: { type: 'string', default: 'impact' },
    // meta.json from measure.mjs: commits, tool versions and settings.
    meta: { type: 'string' },
  },
});
if (!files.length) {
  console.error(
    'usage: report.mjs [--title t] [--out impact] <flow.json> <static.json> <feature.json>',
  );
  process.exit(2);
}

const inputs = files.map(f => ({
  file: f,
  ...JSON.parse(readFileSync(f, 'utf8')),
}));
const app = inputs.find(i => i.app)?.app ?? 'app';
// The first flow file is the primary run; further flow files (other mock latencies) feed only the
// latency sweep table.
const flows = inputs.filter(i => i.kind === 'flow');
// Ids of flow.mjs's LABELS.totals rows.
const SWEEP_IDS = ['mutationReflectMs', 'flowMs', 'maxInteractionMs'];
// A flow file without a recorded latency (older kits, --no-build) cannot be placed on the sweep.
const sweepFlows = flows
  .filter(f => f.latencyMs !== undefined)
  .toSorted((a, b) => a.latencyMs - b.latencyMs);
const sweep =
  sweepFlows.length > 1 ?
    sweepFlows.flatMap(f =>
      f.metrics
        .filter(m => SWEEP_IDS.includes(m.id))
        .map(m => ({
          ...m,
          group: 'latency sweep',
          id: `${m.id}@${f.latencyMs}`,
          latencyMs: f.latencyMs,
          label: `${m.label}, ${f.latencyMs} ms latency`,
        })),
    )
  : [];
const metrics = [
  ...inputs
    .filter(i => i.kind !== 'flow' || i === flows[0])
    .flatMap(i => i.metrics.map(m => ({ source: i.kind, ...m }))),
  ...sweep.map(m => ({ source: 'flow', ...m })),
];

function speedText(m) {
  if (m.speed === undefined) return '';
  if (m.verdict === 'same' || m.verdict === 'noise') return '≈1x';
  const r = m.speed;
  const pct = Math.round(Math.abs(r - 1) * 100);
  if (pct === 0) return '≈1x';
  const x = r >= 2 ? r.toFixed(1) : r.toFixed(2);
  return `${x}x (${fmt(pct)}% ${r >= 1 ? 'faster' : 'slower'})`;
}

const fmt = x => {
  if (x === null || x === undefined || Number.isNaN(x)) return '–';
  const a = Math.abs(x);
  if (Number.isInteger(x) || a >= 1000)
    return Math.round(x).toLocaleString('en-US');
  if (a >= 100) return x.toFixed(0);
  if (a >= 10) return x.toFixed(1);
  return String(Math.round(x * 100) / 100);
};
const signed = x => (x > 0 ? '+' : '') + fmt(x);
const verdictText = v =>
  ({ noise: 'within noise', 'few runs': 'needs 3+ runs' })[v] ?? v;

function cell(m, side) {
  const v = fmt(m[side]);
  const s = m.spread?.[side];
  return s && s[0] !== s[1] ? `${v} (${fmt(s[0])}–${fmt(s[1])})` : v;
}
function change(m) {
  let c = signed(m.delta);
  if (m.pct !== null && m.pct !== undefined && m.delta !== 0)
    c += ` (${signed(m.pct)}%)`;
  if (m.ci95 && (m.ci95[0] !== m.delta || m.ci95[1] !== m.delta))
    c += ` [${signed(m.ci95[0])}, ${signed(m.ci95[1])}]`;
  return c;
}

const groups = [...new Set(metrics.map(m => m.group))];
const LABEL = {
  baseline: opt['baseline-label'],
  migrated: opt['migrated-label'],
};
// Installed libraries only; meta.json keeps null for the configured ones a checkout lacks.
const formatLibs = libs =>
  Object.entries(libs ?? {})
    .filter(([, ver]) => ver)
    .map(([lib, ver]) => `${lib} ${ver}`)
    .join(', ') || 'none found';
const countFailures = failures =>
  Object.entries(failures ?? {})
    .filter(([, f]) => f.length)
    .map(([v, f]) => `${LABEL[v]} ${f.length}`)
    .join(', ');
const meta = opt.meta ? JSON.parse(readFileSync(opt.meta, 'utf8')) : null;
const lines = [`# ${opt.title ?? `${app}: impact report`}`, ''];

const flow = flows[0];
const feature = inputs.find(i => i.kind === 'feature');
const notes = [];
if (flow) {
  notes.push(
    `Flow: ${flow.runs} interleaved runs per variant at ${flow.cpuThrottle}x CPU throttle; ${flow.steps.length} steps (${flow.steps.filter(s => s.kind === 'mutation').length} mutations).`,
  );
  const failed = countFailures(flow.failures);
  if (failed)
    notes.push(
      `Failed runs: ${failed}. Every row leaves these runs out, which can favor the variant that fails more.`,
    );
}
if (feature) {
  notes.push(
    `Feature cost: "${feature.feature}", ${feature.runs.length / 2} runs per variant, model ${feature.model} at ${feature.effort} effort. Errored agent sessions count as failed acceptance; their spend stays in the medians when the CLI reported it (a timeout or crash reports none).`,
  );
  const failed = countFailures(feature.failures);
  if (failed) notes.push(`Errored agent sessions: ${failed}.`);
  for (const [v, files] of Object.entries(feature.context ?? {}))
    notes.push(
      `Agent guidance in the ${LABEL[v]} copy: ${files.length ? files.map(f => `\`${f}\``).join(', ') : 'none'}.`,
    );
}
notes.push(
  'Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.',
  'Speed is baseline time divided by migrated time: 1.2x means the migrated build is 20% faster, 0.8x means 20% slower. Rows within noise show ≈1x.',
);
if (sweep.length)
  notes.push(
    `Mock API latency: ${flows[0].latencyMs} ms for every table except the latency sweep, which repeats the flow at ${sweepFlows.map(f => `${f.latencyMs} ms`).join(', ')}.`,
  );
else if (flows[0]?.latencyMs !== undefined)
  notes.push(`Mock API latency: ${flows[0].latencyMs} ms.`);
lines.push(...notes.map(n => `- ${n}`), '');

if (meta) {
  lines.push(
    '## Setup',
    '',
    '| Variant | Data libraries | Commit | Uncommitted files | Working-tree diff sha1 |',
    '| --- | --- | --- | --- | --- |',
    ...Object.entries(meta.checkouts).map(
      ([v, c]) =>
        `| ${LABEL[v]} | ${formatLibs(c.dataLibs)} | ${c.commit ?? 'not a git checkout'} | ${c.uncommittedFiles ?? '–'} | ${c.treeDiffSha1 ?? '–'} |`,
    ),
    '',
    `Config \`${meta.config}\`, prep ${meta.prep.map(p => `\`${p}\``).join(', ') || 'none'}, Node ${meta.node}, Playwright ${meta.playwright ?? 'unknown'}.`,
    '',
  );
}

for (const g of groups) {
  const rows = metrics.filter(x => x.group === g);
  // Only tables with a duration get a speed column.
  const withSpeed = rows.some(m => m.speed !== undefined);
  lines.push(
    `## ${g[0].toUpperCase() + g.slice(1)}`,
    '',
    `| Metric | Unit | ${LABEL.baseline} | ${LABEL.migrated} | Change |${withSpeed ? ' Speed |' : ''} Verdict |`,
    `| --- | --- | --- | --- | --- |${withSpeed ? ' --- |' : ''} --- |`,
    ...rows.map(
      m =>
        `| ${m.label} | ${m.unit} | ${cell(m, 'baseline')} | ${cell(m, 'migrated')} | ${change(m)} |${withSpeed ? ` ${speedText(m)} |` : ''} ${verdictText(m.verdict)} |`,
    ),
    '',
  );
}

writeFileSync(
  `${opt.out}.json`,
  JSON.stringify(
    {
      schema: 1,
      app,
      title: opt.title,
      labels: LABEL,
      generated: new Date().toISOString(),
      meta,
      inputs: inputs.map(i => ({
        file: i.file,
        kind: i.kind,
        date: i.date,
        latencyMs: i.latencyMs,
      })),
      metrics,
    },
    null,
    1,
  ),
);
writeFileSync(`${opt.out}.md`, lines.join('\n'));
console.error(`wrote ${opt.out}.json and ${opt.out}.md`);
