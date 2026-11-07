// node --test .agents/projects/migrations/impact/utils/
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { matchesGlob } from './glob.mjs';
import { metric } from './metrics.mjs';
import { compare } from './stats.mjs';
import { summarizeTrace } from './trace.mjs';

test('compare: a clear drop is better, overlap is noise, equal counts are same', () => {
  const slow = [100, 102, 98, 101, 99, 100, 103, 97];
  const fast = slow.map(x => x - 20);
  assert.equal(compare(slow, fast).verdict, 'better');
  assert.equal(compare(fast, slow).verdict, 'worse');
  assert.equal(compare(slow, [...slow].reverse()).verdict, 'noise');
  assert.equal(compare([2, 2, 2], [2, 2, 2]).verdict, 'same');
  assert.equal(compare([6, 6, 6], [2, 2, 2]).verdict, 'better');
});

test('compare: higher-is-better flips the verdict, and too few runs is flagged', () => {
  assert.equal(
    compare([1, 1, 1], [3, 3, 3], { lowerIsBetter: false }).verdict,
    'better',
  );
  assert.equal(compare([1, 2], [5, 6]).verdict, 'few runs');
  assert.equal(
    compare([1, 1, 1], [3, 3, 3], { lowerIsBetter: null }).verdict,
    'changed',
  );
});

test('compare: changes below display precision are same, not worse', () => {
  const cls = [1.1e-4, 1.2e-4, 1.4e-4, 1.7e-4];
  assert.equal(compare([0, 0, 0, 0], cls).verdict, 'same');
  assert.equal(compare([0, 0, 0, 0], cls).delta, 0);
});

test('metric: rounding noise is same, null direction is changed', () => {
  assert.equal(metric('g', 'id', 'l', 'kB', 7.681, 7.6812).verdict, 'same');
  assert.equal(
    metric('g', 'id', 'l', 'files', 3, 5, { lowerIsBetter: null }).verdict,
    'changed',
  );
  assert.equal(metric('g', 'id', 'l', 'kB', 10, 5).pct, -50);
});

test('matchesGlob', () => {
  assert.ok(matchesGlob('src/features/a/api/x.ts', 'src/features/*/api/**'));
  assert.ok(matchesGlob('src/a/__tests__/b.test.tsx', '**/__tests__/**'));
  assert.ok(matchesGlob('src/x.test.ts', '**/*.test.{ts,tsx}'));
  assert.ok(matchesGlob('assets/db-1a.js', 'assets/db-*.js'));
  assert.ok(!matchesGlob('src/features/a/b/api/x.ts', 'src/features/*/api/**'));
  assert.ok(!matchesGlob('assets/index.js', 'assets/db-*.js'));
});

test('summarizeTrace counts nested main-thread events once', () => {
  const ev = (name, ts, dur, tid = 1) => ({
    ph: 'X',
    name,
    ts,
    dur,
    pid: 1,
    tid,
  });
  const trace = {
    traceEvents: [
      {
        name: 'thread_name',
        ph: 'M',
        pid: 1,
        tid: 1,
        args: { name: 'CrRendererMain' },
      },
      ev('v8.evaluateModule', 0, 10_000),
      ev('V8.CompileCode', 2_000, 3_000), // nested in evaluate
      ev('V8.ParseProgram', 4_000, 2_000), // overlaps compile
      ev('FunctionCall', 20_000, 5_000),
      ev('v8.evaluateModule', 0, 50_000, 2), // other thread, ignored
    ],
  };
  assert.deepEqual(summarizeTrace(Buffer.from(JSON.stringify(trace))), {
    parseCompileMs: 4,
    evaluateMs: 10,
    scriptMs: 15,
  });
});
