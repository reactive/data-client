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
const metrics = inputs.flatMap(i =>
  i.metrics.map(m => ({ source: i.kind, ...m })),
);

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
const VERDICT = {
  better: 'better',
  worse: 'worse',
  noise: 'within noise',
  same: 'same',
  changed: 'changed',
  'few runs': 'needs 3+ runs',
};

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
const B = opt['baseline-label'];
const M = opt['migrated-label'];
const lines = [`# ${opt.title ?? `${app}: impact report`}`, ''];

const flow = inputs.find(i => i.kind === 'flow');
const feature = inputs.find(i => i.kind === 'feature');
const notes = [];
if (flow) {
  notes.push(
    `Flow: ${flow.runs} interleaved runs per variant at ${flow.cpuThrottle}x CPU throttle; ${flow.steps.length} steps (${flow.steps.filter(s => s.kind === 'mutation').length} mutations).`,
  );
  const failed = Object.entries(flow.failures).filter(([, f]) => f.length);
  if (failed.length)
    notes.push(
      `Failed runs: ${failed.map(([v, f]) => `${v} ${f.length}`).join(', ')}.`,
    );
}
if (feature)
  notes.push(
    `Feature cost: "${feature.feature}", ${feature.runs.length / 2} runs per variant, model ${feature.model} at ${feature.effort} effort.`,
  );
notes.push(
  'Sampled rows show median (interquartile range); the change column adds a 95% bootstrap interval in brackets. "Within noise" means that interval includes zero.',
);
lines.push(...notes.map(n => `- ${n}`), '');

const counts = { better: 0, worse: 0, noise: 0 };
for (const m of metrics) if (m.verdict in counts) counts[m.verdict]++;
lines.push(
  `**${counts.better} better, ${counts.worse} worse, ${counts.noise} within noise** (rows with a preferred direction).`,
  '',
);

for (const g of groups) {
  lines.push(`## ${g[0].toUpperCase() + g.slice(1)}`, '');
  lines.push(
    `| Metric | Unit | ${B} | ${M} | Change | Verdict |`,
    '| --- | --- | --- | --- | --- | --- |',
  );
  for (const m of metrics.filter(x => x.group === g)) {
    lines.push(
      `| ${m.label} | ${m.unit} | ${cell(m, 'baseline')} | ${cell(m, 'migrated')} | ${change(m)} | ${VERDICT[m.verdict] ?? m.verdict} |`,
    );
  }
  lines.push('');
}

writeFileSync(
  `${opt.out}.json`,
  JSON.stringify(
    {
      schema: 1,
      app,
      title: opt.title,
      labels: { baseline: B, migrated: M },
      generated: new Date().toISOString(),
      inputs: inputs.map(i => ({ file: i.file, kind: i.kind, date: i.date })),
      metrics,
    },
    null,
    1,
  ),
);
writeFileSync(`${opt.out}.md`, lines.join('\n'));
console.error(`wrote ${opt.out}.json and ${opt.out}.md`);
