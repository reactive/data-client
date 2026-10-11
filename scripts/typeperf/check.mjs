// Type-check performance budget for @data-client's public types.
//
// Generates the fixtures (gen.mjs), type-checks each with the repo's `tsc`
// (TypeScript 7, @typescript/native), and fails when a fixture has errors or its
// instantiation count exceeds budget.json by more than TOLERANCE.
// Unlike check time, instantiations are deterministic for a given TypeScript
// version, so they are what the budget tracks.
//
// usage: yarn check:typeperf [--update] [scenario...]
//   --update  rewrite budget.json with the current counts (after an intended change)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generate } from './gen.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const budgetFile = path.join(dir, 'budget.json');
const TOLERANCE = 0.1;

// The `tsc` bin yarn puts on PATH, so the check follows the compiler the repo builds with
const tsc = (...args) =>
  spawnSync('tsc', args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
const tsVersion = tsc('--version').stdout.match(/[\d.]+/)?.[0];

const args = process.argv.slice(2);
const update = args.includes('--update');
const only = args.filter(a => !a.startsWith('--'));
const budget = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));

const failures = [];
const lowered = [];
let needsUpdate = false;
// A full --update re-records from scratch, dropping removed fixtures
if (update && !only.length) budget.instantiations = {};
console.log(`TypeScript ${tsVersion}\n`);
console.log('scenario\tinstantiations\tbudget\tchange\ttime');
for (const s of generate(only)) {
  const { status, stdout, stderr } = tsc(
    '-p',
    // relative, so a Windows shell doesn't split a checkout path with spaces
    path.relative(
      process.cwd(),
      path.join(dir, 'scenarios', s, 'tsconfig.json'),
    ),
    '--extendedDiagnostics',
    '--pretty',
    'false',
  );
  const stat = name =>
    stdout.match(new RegExp(`^${name}:\\s+(\\S+)`, 'm'))?.[1];
  const count = Number(stat('Instantiations'));
  if (Number.isNaN(count)) {
    console.error(stdout, stderr);
    failures.push(`${s}: tsc did not report instantiations`);
    continue;
  }
  if (status !== 0) {
    const errors = stdout.match(/^.* error TS\d+:.*$/gm) ?? [];
    failures.push(
      `${s}: tsc exited with ${status}, ${errors.length} type errors`,
    );
    console.error(errors.slice(0, 10).join('\n') || stderr);
  }

  const max = budget.instantiations[s];
  const change = max ? (count - max) / max : 0;
  const pct =
    max ? `${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%` : 'new';
  console.log(`${s}\t${count}\t${max ?? '-'}\t${pct}\t${stat('Total time')}`);
  if (update) {
    budget.instantiations[s] = count;
  } else if (!max) {
    needsUpdate = true;
    failures.push(`${s}: has no budget`);
  } else if (change > TOLERANCE) {
    needsUpdate = true;
    failures.push(
      `${s}: ${count} instantiations is ${pct} over its budget of ${max}`,
    );
  } else if (change < -TOLERANCE) {
    lowered.push(s);
  }
}

if (update) {
  budget.typescript = tsVersion;
  fs.writeFileSync(budgetFile, JSON.stringify(budget, null, 2) + '\n');
  console.log(`\nUpdated ${path.relative(process.cwd(), budgetFile)}`);
} else if (budget.typescript !== tsVersion) {
  console.log(
    `\nbudget.json was recorded with TypeScript ${budget.typescript}; re-record it with --update if the compiler upgrade moved the counts.`,
  );
}
if (lowered.length)
  console.log(
    `\n${lowered.join(', ')} dropped more than ${TOLERANCE * 100}% below budget; run with --update to lock in the win.`,
  );
if (failures.length) {
  console.error(`\n${failures.join('\n')}`);
  if (needsUpdate)
    console.error(
      '\nIf the change is intended, run `yarn check:typeperf --update` and commit budget.json.',
    );
  process.exit(1);
}
