/**
 * Deterministic unit tests for GC interaction metrics, stable IDs, and report completeness.
 *
 *   yarn test:gc-metrics
 */
import { buildGCReport } from './gc-report.ts';
import {
  browserGCScenarioId,
  computeMaxInputDelayMs,
  excessMissedFrames,
  frameIntervalsFromTimestamps,
  longTaskOverlapsWindow,
  parseBrowserGCScenarioId,
} from '../src/data-client/gcInteractionMetrics.ts';

function assert(cond: boolean, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  assert(
    Object.is(actual, expected) || actual === expected,
    `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}

function assertClose(
  actual: number,
  expected: number,
  eps: number,
  label: string,
) {
  assert(
    Math.abs(actual - expected) <= eps,
    `${label}: expected ≈${expected} (±${eps}), got ${actual}`,
  );
}

// --- frameIntervalsFromTimestamps ---
assertEq(frameIntervalsFromTimestamps([]).length, 0, 'empty timestamps');
assertEq(frameIntervalsFromTimestamps([10]).length, 0, 'single timestamp');
{
  const intervals = frameIntervalsFromTimestamps([0, 16.7, 50.1]);
  assertEq(intervals.length, 2, 'two intervals');
  assertClose(intervals[0], 16.7, 1e-9, 'first interval');
  assertClose(intervals[1], 33.4, 1e-9, '2-period gap interval');
}

// --- excessMissedFrames (nearest-period) ---
const period = 16.67;
assertEq(excessMissedFrames([period], period), 0, 'nominal 1× interval');
assertEq(
  excessMissedFrames([period * 1.98], period),
  1,
  '1.98× must count as 2 periods → 1 missed (floor would wrongly yield 0)',
);
assertEq(
  excessMissedFrames([32.5], 16.67),
  1,
  '32.5/16.67≈1.95 → round to 2 → 1 missed',
);
assertEq(
  excessMissedFrames([period * 0.9, period * 1.05], period),
  0,
  'sub-period jitter around 1× → zero excess',
);
assertEq(
  excessMissedFrames([period * 2.9, period], period),
  2,
  '2.9× → 3 periods → 2 missed; plus nominal frame',
);
assertEq(excessMissedFrames([period], 0), 0, 'zero displayPeriod safe');

// Calibration-scale gap (~45ms busy with ~16.7 period → ~2 missed)
{
  const blockedSpan = frameIntervalsFromTimestamps([
    0,
    16.7,
    16.7 + 45,
    16.7 + 45 + 16.7,
  ]);
  assertEq(
    excessMissedFrames(blockedSpan, 16.7),
    2,
    '45ms blocked span → 2 missed frames over one expected period',
  );
  assert(
    Math.max(...blockedSpan) >= 16.7 * 1.5,
    'calibration-scale interval exceeds 1.5× display period',
  );
}

// --- computeMaxInputDelayMs ---
assertEq(
  computeMaxInputDelayMs(12, [16.7, 16.7], 16.7),
  12,
  'timer dominates when frames are nominal',
);
assertEq(
  computeMaxInputDelayMs(5, [16.7, 40], 16.7),
  40 - 16.7,
  'frame excess dominates when larger than timer',
);
assertEq(computeMaxInputDelayMs(0, [], 16.7), 0, 'empty frames → timer only');

// --- longTaskOverlapsWindow ---
assert(
  longTaskOverlapsWindow({ startTime: 9, duration: 20 }, 10, 40),
  'entry starting just before windowStart still overlaps',
);
assert(
  !longTaskOverlapsWindow({ startTime: 0, duration: 5 }, 10, 40),
  'entry ending before windowStart does not overlap',
);
assert(
  !longTaskOverlapsWindow({ startTime: 40, duration: 5 }, 10, 40),
  'entry starting at windowEnd does not overlap',
);
assert(
  longTaskOverlapsWindow({ startTime: 15, duration: 10 }, 10, 40),
  'entry fully inside window overlaps',
);

// --- stable semantic IDs ---
assertEq(
  browserGCScenarioId({
    candidateKind: 'endpoint',
    pattern: 'unique',
    count: 100000,
    control: 'gc',
  }),
  'browser/endpoint/unique/100000/end-to-end/gc',
  'endpoint unique 100k gc id',
);
assertEq(
  browserGCScenarioId({
    candidateKind: 'entity',
    pattern: 'duplicate',
    count: 1000,
    control: 'no-gc',
  }),
  'browser/entity/duplicate/1000/end-to-end/no-gc',
  'entity duplicate no-gc id',
);
{
  const id = 'browser/mixed/unique/10000/end-to-end/gc';
  const parsed = parseBrowserGCScenarioId(id);
  assertEq(parsed.candidateKind, 'mixed', 'parse kind');
  assertEq(parsed.pattern, 'unique', 'parse pattern');
  assertEq(parsed.count, 10000, 'parse count');
  assertEq(parsed.control, 'gc', 'parse control');
  assertEq(parsed.mode, 'end-to-end', 'parse mode');
  assertEq(browserGCScenarioId(parsed), id, 'round-trip id');
}
let threw = false;
try {
  browserGCScenarioId({
    candidateKind: 'endpoint',
    pattern: 'duplicate',
    count: 1000,
    control: 'gc',
  });
} catch {
  threw = true;
}
assert(threw, 'duplicate+endpoint must throw');

// --- report complete flag ---
{
  const provenance = {
    schemaVersion: 1 as const,
    buildId: 'abc',
    commit: 'deadbeef',
    dirty: false,
    sourceDigest: 'digest',
    artifacts: {},
    servedManifestBuildId: 'abc',
  };
  const completeReport = buildGCReport({
    scenarios: [],
    samplesPerScenario: 5,
    filter: null,
    browserVersion: '1',
    headless: true,
    requestedScenarios: 0,
    requestedSamples: 0,
    completedScenarios: 0,
    completedSamples: 0,
    failures: [],
    provenance,
  });
  assert(completeReport.complete === true, 'empty requested → complete');

  const incomplete = buildGCReport({
    scenarios: [],
    samplesPerScenario: 5,
    filter: null,
    browserVersion: '1',
    headless: true,
    requestedScenarios: 1,
    requestedSamples: 5,
    completedScenarios: 0,
    completedSamples: 2,
    failures: [
      {
        scenarioId: 'browser/endpoint/unique/100000/end-to-end/gc',
        sampleIndex: 2,
        error: 'boom',
      },
    ],
    provenance,
  });
  assert(incomplete.complete === false, 'failures → complete:false');
  assertEq(incomplete.failures.length, 1, 'failures recorded');
  assertEq(incomplete.completedSamples, 2, 'partial samples counted');
  assertEq(
    incomplete.provenance.buildId,
    'abc',
    'provenance from verified manifest not HEAD',
  );
}

/** Throwing work must reject promptly and leave no active rAF polyfill chain. */
async function testThrowingWorkRejectsPromptly() {
  const { runChromiumInteractionProbe } =
    await import('../src/data-client/gcInteractionProbe.ts');

  const pendingRaf = new Set<ReturnType<typeof setTimeout>>();
  const g = globalThis as typeof globalThis & {
    requestAnimationFrame?: (cb: (t: number) => void) => number;
    cancelAnimationFrame?: (id: number) => void;
  };
  const prevRaf = g.requestAnimationFrame;
  const prevCancel = g.cancelAnimationFrame;

  g.requestAnimationFrame = (cb: (t: number) => void) => {
    const handle = setTimeout(() => {
      pendingRaf.delete(handle);
      cb(performance.now());
    }, 0);
    pendingRaf.add(handle);
    return handle as unknown as number;
  };
  g.cancelAnimationFrame = (id: number) => {
    const handle = id as unknown as ReturnType<typeof setTimeout>;
    clearTimeout(handle);
    pendingRaf.delete(handle);
  };

  try {
    const t0 = performance.now();
    let rejected: unknown;
    try {
      await runChromiumInteractionProbe({
        displayPeriodMs: 16.7,
        work: () => {
          throw new Error('synthetic work boom');
        },
      });
    } catch (err) {
      rejected = err;
    }
    const elapsed = performance.now() - t0;
    assert(rejected instanceof Error, 'throwing work must reject');
    assert(
      (rejected as Error).message === 'synthetic work boom',
      'rejection carries work error',
    );
    assert(elapsed < 500, `must reject promptly (elapsed ${elapsed}ms)`);

    await new Promise<void>(r => setTimeout(r, 30));
    assert(
      pendingRaf.size === 0,
      `no active rAF chain after reject (pending=${pendingRaf.size})`,
    );
  } finally {
    if (prevRaf) g.requestAnimationFrame = prevRaf;
    else delete g.requestAnimationFrame;
    if (prevCancel) g.cancelAnimationFrame = prevCancel;
    else delete g.cancelAnimationFrame;
  }
}

testThrowingWorkRejectsPromptly()
  .then(() => {
    process.stderr.write('gc-interaction-metrics: all assertions passed\n');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
