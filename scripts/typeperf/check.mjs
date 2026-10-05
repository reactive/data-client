// Type-check performance budget for @data-client's public types.
//
// Generates the fixtures (gen.mjs), type-checks each with the `typescript` package,
// and fails when a fixture has errors or its instantiation count exceeds budget.json
// by more than TOLERANCE. Unlike check time, instantiations are deterministic for a
// given TypeScript version, so they are what the budget tracks.
//
// usage: yarn check:typeperf [--update] [scenario...]
//   --update  rewrite budget.json with the current counts (after an intended change)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { generate } from './gen.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const budgetFile = path.join(dir, 'budget.json');
const TOLERANCE = 0.1;

const args = process.argv.slice(2);
const update = args.includes('--update');
const only = args.filter(a => !a.startsWith('--'));
const budget = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));

// Share parsed lib and @data-client .d.ts files between fixtures; each program still
// gets its own checker, so instantiation counts are unaffected.
const sourceFiles = new Map();
const host = options => {
  const h = ts.createCompilerHost(options);
  const getSourceFile = h.getSourceFile;
  h.getSourceFile = (file, ...rest) => {
    if (file.includes('/scenarios/')) return getSourceFile(file, ...rest);
    if (!sourceFiles.has(file))
      sourceFiles.set(file, getSourceFile(file, ...rest));
    return sourceFiles.get(file);
  };
  return h;
};

const failures = [];
const lowered = [];
let needsUpdate = false;
// A full --update re-records from scratch, dropping removed fixtures
if (update && !only.length) budget.instantiations = {};
console.log(`TypeScript ${ts.version}\n`);
console.log('scenario\tinstantiations\tbudget\tchange\ttime');
for (const s of generate(only)) {
  const cfg = ts.getParsedCommandLineOfConfigFile(
    path.join(dir, 'scenarios', s, 'tsconfig.json'),
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
  );
  const start = performance.now();
  const program = ts.createProgram(
    cfg.fileNames,
    cfg.options,
    host(cfg.options),
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const seconds = (performance.now() - start) / 1000;
  const count = program.getInstantiationCount();
  if (diagnostics.length) {
    failures.push(`${s}: ${diagnostics.length} type errors`);
    console.error(
      ts.formatDiagnostics(diagnostics.slice(0, 10), {
        getCanonicalFileName: f => f,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => '\n',
      }),
    );
  }

  const max = budget.instantiations[s];
  const change = max ? (count - max) / max : 0;
  const pct =
    max ? `${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%` : 'new';
  console.log(`${s}\t${count}\t${max ?? '-'}\t${pct}\t${seconds.toFixed(1)}s`);
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
  budget.typescript = ts.version;
  fs.writeFileSync(budgetFile, JSON.stringify(budget, null, 2) + '\n');
  console.log(`\nUpdated ${path.relative(process.cwd(), budgetFile)}`);
} else if (budget.typescript !== ts.version) {
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
