/// <reference types="node" />
import { chromium } from 'playwright';
import type { Browser, CDPSession, Page } from 'playwright';

import { collectMeasures, getMeasureDuration } from './measure.js';
import { collectHeapUsed } from './memory.js';
import { formatReport, type BenchmarkResult } from './report.js';
import {
  SCENARIOS,
  LIBRARIES,
  RUN_CONFIG,
  ACTION_GROUPS,
  NETWORK_SIM_DELAYS,
} from './scenarios.js';
import { computeStats, isConverged } from './stats.js';
import { parseTraceDuration } from './tracing.js';
import type { Scenario, ScenarioSize } from '../src/shared/types.js';

// ---------------------------------------------------------------------------
// CLI + env var parsing
// ---------------------------------------------------------------------------

function parseArgs(): {
  libs?: string[];
  size?: ScenarioSize;
  actions?: string[];
  scenario?: string;
  networkSim: boolean;
} {
  const argv = process.argv.slice(2);
  const get = (flag: string, envVar: string): string | undefined => {
    const idx = argv.indexOf(flag);
    if (idx !== -1 && idx + 1 < argv.length) return argv[idx + 1];
    return process.env[envVar] || undefined;
  };

  const libRaw = get('--lib', 'BENCH_LIB');
  const sizeRaw = get('--size', 'BENCH_SIZE');
  const actionRaw = get('--action', 'BENCH_ACTION');
  const scenarioRaw = get('--scenario', 'BENCH_SCENARIO');
  const networkSimRaw = get('--network-sim', 'BENCH_NETWORK_SIM');

  const libs = libRaw ? libRaw.split(',').map(s => s.trim()) : undefined;
  const size = sizeRaw === 'small' || sizeRaw === 'large' ? sizeRaw : undefined;
  const actions =
    actionRaw ? actionRaw.split(',').map(s => s.trim()) : undefined;
  const networkSim =
    networkSimRaw != null ? networkSimRaw !== 'false' : !process.env.CI;

  return { libs, size, actions, scenario: scenarioRaw, networkSim };
}

function filterScenarios(scenarios: Scenario[]): {
  filtered: Scenario[];
  libraries: string[];
  networkSim: boolean;
} {
  const {
    libs,
    size,
    actions,
    scenario: scenarioFilter,
    networkSim,
  } = parseArgs();

  const libraries = libs ?? (process.env.CI ? ['data-client'] : [...LIBRARIES]);

  let filtered = scenarios;

  // In CI, restrict to data-client hot-path only (existing behavior)
  if (process.env.CI) {
    filtered = filtered.filter(
      s =>
        s.name.startsWith('data-client:') &&
        s.category !== 'memory' &&
        s.category !== 'startup',
    );
  } else if (
    !actions ||
    !actions.some(a => a === 'memory' || a === 'mountUnmountCycle')
  ) {
    // Locally: exclude memory by default; use --action memory to include
    filtered = filtered.filter(s => s.category !== 'memory');
  }

  if (libs) {
    filtered = filtered.filter(s => libs.some(l => s.name.startsWith(`${l}:`)));
  }

  if (size) {
    filtered = filtered.filter(s => (s.size ?? 'small') === size);
  }

  if (actions) {
    const resolvedActions = new Set<string>();
    for (const a of actions) {
      if (a in ACTION_GROUPS) {
        for (const act of ACTION_GROUPS[a]) resolvedActions.add(act);
      } else {
        resolvedActions.add(a);
      }
    }
    filtered = filtered.filter(s => resolvedActions.has(s.action));
  }

  if (scenarioFilter) {
    filtered = filtered.filter(s => s.name.includes(scenarioFilter));
  }

  // Multi-lib runs: omit scenarios that do not apply to every selected library (e.g. invalidate-and-resolve).
  filtered = filtered.filter(
    s =>
      !s.onlyLibs?.length || libraries.every(lib => s.onlyLibs!.includes(lib)),
  );

  return { filtered, libraries, networkSim };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL =
  process.env.BENCH_BASE_URL ??
  `http://localhost:${process.env.BENCH_PORT ?? '5173'}`;
const BENCH_LABEL =
  process.env.BENCH_LABEL ? ` [${process.env.BENCH_LABEL}]` : '';
const USE_TRACE = process.env.BENCH_TRACE === 'true';
const MEMORY_WARMUP = 1;
const MEMORY_MEASUREMENTS = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScenarioResult {
  value: number;
  reactCommit?: number;
  traceDuration?: number;
}

interface ScenarioSamples {
  value: number[];
  reactCommit: number[];
  trace: number[];
}

// ---------------------------------------------------------------------------
// Scenario runner
// ---------------------------------------------------------------------------

const REF_STABILITY_METRICS = ['issueRefChanged', 'userRefChanged'] as const;

function isRefStabilityScenario(scenario: Scenario): scenario is Scenario & {
  resultMetric: (typeof REF_STABILITY_METRICS)[number];
} {
  return (
    scenario.resultMetric === 'issueRefChanged' ||
    scenario.resultMetric === 'userRefChanged'
  );
}

async function runScenario(
  page: Page,
  lib: string,
  scenario: Scenario,
  networkSim: boolean,
  cdp?: CDPSession,
): Promise<ScenarioResult> {
  const appPath = `/${lib}/`;
  await page.goto(`${BASE_URL}${appPath}`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('[data-app-ready]', {
    timeout: 120000,
    state: 'attached',
  });

  const harness = page.locator('[data-bench-harness]');
  await harness.waitFor({ state: 'attached' });

  const bench = await page.evaluateHandle('window.__BENCH__');
  if (await bench.evaluate(b => b == null))
    throw new Error('window.__BENCH__ not found');

  if (networkSim) {
    await (bench as any).evaluate(
      (api: any, delays: Record<string, number>) => api.setMethodDelays(delays),
      NETWORK_SIM_DELAYS,
    );
  }

  if (scenario.renderLimit != null) {
    await (bench as any).evaluate(
      (api: any, n: number) => api.setRenderLimit(n),
      scenario.renderLimit,
    );
  }

  const isMemory =
    scenario.action === 'mountUnmountCycle' &&
    scenario.resultMetric === 'heapDelta';
  if (isMemory) {
    const memoryCdp = await page.context().newCDPSession(page);
    try {
      await memoryCdp.send('Performance.enable');
    } catch {
      // best-effort
    }
    const heapBefore = await collectHeapUsed(memoryCdp);
    await (bench as any).evaluate(async (api: any, a: unknown[]) => {
      if (api.mountUnmountCycle)
        await api.mountUnmountCycle(...(a as [number, number]));
    }, scenario.args);
    await page.waitForSelector('[data-bench-complete]', {
      timeout: 60000,
      state: 'attached',
    });
    const timedOut = await harness.evaluate(el =>
      el.hasAttribute('data-bench-timeout'),
    );
    if (timedOut) {
      throw new Error(
        `Harness timeout during mountUnmountCycle: a cycle did not complete within 30 s`,
      );
    }
    await (bench as any).evaluate((api: any) => {
      if (api.triggerGC) api.triggerGC();
    });
    await page.waitForTimeout(100);
    const heapAfter = await collectHeapUsed(memoryCdp);
    await bench.dispose();
    return { value: heapAfter - heapBefore };
  }

  const isUpdate =
    scenario.action === 'updateEntity' ||
    scenario.action === 'updateEntityMultiView' ||
    scenario.action === 'updateUser' ||
    scenario.action === 'invalidateAndResolve' ||
    scenario.action === 'unshiftItem' ||
    scenario.action === 'deleteEntity' ||
    scenario.action === 'moveItem';
  const isRefStability = isRefStabilityScenario(scenario);
  const isInit = scenario.action === 'init';

  const mountCount = scenario.mountCount ?? 100;
  if (isUpdate || isRefStability) {
    const preMountAction = scenario.preMountAction ?? 'init';
    await harness.evaluate(el => {
      el.removeAttribute('data-bench-complete');
      el.removeAttribute('data-bench-timeout');
    });
    await (bench as any).evaluate(
      (api: any, [action, n]: [string, number]) => api[action](n),
      [preMountAction, mountCount],
    );
    await page.waitForSelector('[data-bench-complete]', {
      timeout: 10000,
      state: 'attached',
    });
    const preMountTimedOut = await harness.evaluate(el =>
      el.hasAttribute('data-bench-timeout'),
    );
    if (preMountTimedOut) {
      throw new Error(
        `Harness timeout during pre-mount (${preMountAction}): did not complete within 30 s`,
      );
    }
    await page.evaluate(() => {
      performance.clearMarks();
      performance.clearMeasures();
    });
  }

  if (isRefStability) {
    await (bench as any).evaluate((api: any) => api.captureRefSnapshot());
  }

  await harness.evaluate(el => {
    el.removeAttribute('data-bench-complete');
    el.removeAttribute('data-bench-timeout');
  });
  const cdpTracing =
    USE_TRACE && !isRefStability ?
      await page.context().newCDPSession(page)
    : undefined;
  const traceChunks: object[] = [];
  if (cdpTracing) {
    cdpTracing.on('Tracing.dataCollected', (params: { value: object[] }) => {
      traceChunks.push(...params.value);
    });
    await cdpTracing.send('Tracing.start', {
      categories: 'devtools.timeline,blink',
    });
  }

  await page.evaluate(() => {
    performance.clearMarks();
    performance.clearMeasures();
  });

  await (bench as any).evaluate(
    (api: any, { action, args }: { action: string; args: unknown[] }) => {
      api[action](...args);
    },
    { action: scenario.action, args: scenario.args },
  );

  const completeTimeout = networkSim ? 60000 : 10000;
  await page.waitForSelector('[data-bench-complete]', {
    timeout: completeTimeout,
    state: 'attached',
  });

  const timedOut = await harness.evaluate(el =>
    el.hasAttribute('data-bench-timeout'),
  );
  if (timedOut) {
    throw new Error(
      `Harness timeout: MutationObserver did not detect expected DOM update within 30 s`,
    );
  }

  await (bench as any).evaluate((api: any) => api.flushPendingMutations());

  let traceDuration: number | undefined;
  if (cdpTracing) {
    try {
      const done = new Promise<void>(resolve => {
        cdpTracing!.on('Tracing.tracingComplete', () => resolve());
      });
      await cdpTracing.send('Tracing.end');
      await done;
      const traceJson =
        '[\n' + traceChunks.map(e => JSON.stringify(e)).join(',\n') + '\n]';
      traceDuration = parseTraceDuration(Buffer.from(traceJson));
    } catch {
      traceDuration = undefined;
    } finally {
      await cdpTracing.detach().catch(() => {});
    }
  }

  if (isRefStability && scenario.resultMetric) {
    const report = await (bench as any).evaluate((api: any) =>
      api.getRefStabilityReport(),
    );
    await bench.dispose();
    return { value: report[scenario.resultMetric] as number };
  }

  const measures = await collectMeasures(page);
  const isMountLike =
    isInit ||
    scenario.action === 'mountSortedView' ||
    scenario.action === 'initDoubleList' ||
    scenario.action === 'listDetailSwitch';
  const duration =
    isMountLike ?
      getMeasureDuration(measures, 'mount-duration')
    : getMeasureDuration(measures, 'update-duration');
  // Both mount-like and update scenarios trigger state updates (setItems/etc.),
  // so React Profiler always fires with phase: 'update' for the measured action.
  const reactCommit = getMeasureDuration(measures, 'react-commit-update');

  await bench.dispose();
  return {
    value: duration,
    reactCommit: reactCommit > 0 ? reactCommit : undefined,
    traceDuration,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function scenarioUnit(scenario: Scenario): string {
  if (isRefStabilityScenario(scenario)) return 'count';
  if (scenario.resultMetric === 'heapDelta') return 'bytes';
  return 'ms';
}

function recordResult(
  samples: Map<string, ScenarioSamples>,
  scenario: Scenario,
  result: ScenarioResult,
) {
  const s = samples.get(scenario.name)!;
  s.value.push(result.value);
  s.reactCommit.push(result.reactCommit ?? NaN);
  s.trace.push(result.traceDuration ?? NaN);
}

function warmupCount(scenario: Scenario): number {
  if (scenario.deterministic) return 0;
  if (scenario.category === 'memory') return MEMORY_WARMUP;
  return RUN_CONFIG[scenario.size ?? 'small'].warmup;
}

/** Run each scenario once per matching library (one browser context per lib). */
async function runRound(
  browser: Browser,
  scenarios: Scenario[],
  libs: string[],
  networkSim: boolean,
  samples: Map<string, ScenarioSamples>,
  opts: { shuffleLibs?: boolean; showProgress?: boolean } = {},
): Promise<void> {
  const orderedLibs = opts.shuffleLibs ? shuffle([...libs]) : libs;
  let done = 0;
  const total = scenarios.length;

  for (const lib of orderedLibs) {
    let libScenarios = scenarios.filter(s => s.name.startsWith(`${lib}:`));
    if (libScenarios.length === 0) continue;
    if (opts.shuffleLibs) libScenarios = shuffle(libScenarios);

    const context = await browser.newContext();
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    for (const scenario of libScenarios) {
      // Force GC before each scenario to reduce variance from prior allocations
      try {
        await cdp.send('HeapProfiler.collectGarbage');
      } catch {}
      await page.waitForTimeout(50);

      done++;
      const prefix = opts.showProgress ? `[${done}/${total}] ` : '';
      try {
        const result = await runScenario(page, lib, scenario, networkSim, cdp);
        recordResult(samples, scenario, result);
        const commitSuffix =
          result.reactCommit != null ?
            ` (commit ${result.reactCommit.toFixed(2)} ms)`
          : '';
        process.stderr.write(
          `  ${prefix}${scenario.name}: ${result.value.toFixed(2)} ${scenarioUnit(scenario)}${commitSuffix}\n`,
        );
      } catch (err) {
        console.error(
          `  ${prefix}${scenario.name} FAILED:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    await cdp.detach().catch(() => {});
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const {
    filtered: SCENARIOS_TO_RUN,
    libraries,
    networkSim,
  } = filterScenarios(SCENARIOS);

  if (networkSim) {
    process.stderr.write('Network simulation: ON\n');
  }

  if (SCENARIOS_TO_RUN.length === 0) {
    process.stderr.write('No scenarios matched the filters.\n');
    process.exit(1);
  }

  const memoryScenarios = SCENARIOS_TO_RUN.filter(s => s.category === 'memory');
  const mainScenarios = SCENARIOS_TO_RUN.filter(s => s.category !== 'memory');

  const bySize: Record<ScenarioSize, Scenario[]> = { small: [], large: [] };
  for (const s of mainScenarios) {
    bySize[s.size ?? 'small'].push(s);
  }
  const sizeGroups = (
    Object.entries(bySize) as [ScenarioSize, Scenario[]][]
  ).filter(([, arr]) => arr.length > 0);

  const samples = new Map<string, ScenarioSamples>();
  for (const s of SCENARIOS_TO_RUN) {
    samples.set(s.name, { value: [], reactCommit: [], trace: [] });
  }

  const browser = await chromium.launch({ headless: true });

  // Deterministic scenarios: run once, no warmup
  const deterministicNames = new Set<string>();
  const deterministicScenarios = mainScenarios.filter(s => s.deterministic);
  if (deterministicScenarios.length > 0) {
    process.stderr.write(
      `\n── Deterministic scenarios (${deterministicScenarios.length}) ──\n`,
    );
    await runRound(
      browser,
      deterministicScenarios,
      libraries,
      networkSim,
      samples,
    );
    for (const s of deterministicScenarios) deterministicNames.add(s.name);
  }

  // Adaptive-convergence rounds per size group
  for (const [size, scenarios] of sizeGroups) {
    const { warmup, minMeasurement, maxMeasurement, targetMarginPct } =
      RUN_CONFIG[size];
    const nonDeterministic = scenarios.filter(
      s => !deterministicNames.has(s.name),
    );
    if (nonDeterministic.length === 0) continue;

    const maxRounds = warmup + maxMeasurement;
    const converged = new Set<string>();

    for (let round = 0; round < maxRounds; round++) {
      const isMeasure = round >= warmup;
      const phase = isMeasure ? 'measure' : 'warmup';
      const phaseRound = isMeasure ? round - warmup + 1 : round + 1;
      const phaseTotal = isMeasure ? maxMeasurement : warmup;
      const active = nonDeterministic.filter(s => !converged.has(s.name));
      if (active.length === 0) break;

      process.stderr.write(
        `\n── ${size} round ${round + 1}/${maxRounds} (${phase} ${phaseRound}/${phaseTotal}, ${active.length}/${nonDeterministic.length} active) ──\n`,
      );

      await runRound(browser, active, libraries, networkSim, samples, {
        shuffleLibs: true,
        showProgress: true,
      });

      // After each measurement round, check per-scenario convergence
      if (isMeasure) {
        for (const scenario of active) {
          if (
            isConverged(
              samples.get(scenario.name)!.value,
              warmup,
              targetMarginPct,
              minMeasurement,
            )
          ) {
            converged.add(scenario.name);
            const nMeasured = samples.get(scenario.name)!.value.length - warmup;
            process.stderr.write(
              `  [converged] ${scenario.name} after ${nMeasured} measurements\n`,
            );
          }
        }
        if (converged.size === nonDeterministic.length) {
          process.stderr.write(
            `\n── All ${size} scenarios converged, stopping early ──\n`,
          );
          break;
        }
      }
    }
  }

  // Memory: separate phase (opt-in via --action memory)
  if (memoryScenarios.length > 0) {
    const totalRounds = MEMORY_WARMUP + MEMORY_MEASUREMENTS;
    process.stderr.write(
      `\n── Memory (${memoryScenarios.length} scenarios, ${MEMORY_WARMUP} warmup + ${MEMORY_MEASUREMENTS} measurements) ──\n`,
    );
    for (let round = 0; round < totalRounds; round++) {
      const phase = round >= MEMORY_WARMUP ? 'measure' : 'warmup';
      process.stderr.write(
        `\n── Memory round ${round + 1}/${totalRounds} (${phase}) ──\n`,
      );
      await runRound(browser, memoryScenarios, libraries, networkSim, samples, {
        shuffleLibs: true,
      });
    }
  }

  await browser.close();

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------
  const report: BenchmarkResult[] = [];
  for (const scenario of SCENARIOS_TO_RUN) {
    const s = samples.get(scenario.name)!;
    const warmup = warmupCount(scenario);
    if (s.value.length <= warmup) continue;

    const { median, range } = computeStats(s.value, warmup);
    const unit = scenarioUnit(scenario);
    report.push({
      name: scenario.name,
      unit,
      value: Math.round(median * 100) / 100,
      range,
    });

    // React commit times (only meaningful for duration-based scenarios)
    const reactSamples = s.reactCommit
      .slice(warmup)
      .filter(x => !Number.isNaN(x));
    if (reactSamples.length > 0 && !scenario.resultMetric) {
      const { median: rcMedian, range: rcRange } = computeStats(
        reactSamples,
        0,
      );
      report.push({
        name: `${scenario.name} (react commit)`,
        unit: 'ms',
        value: Math.round(rcMedian * 100) / 100,
        range: rcRange,
      });
    }

    // Chrome trace durations (opt-in via BENCH_TRACE=true)
    const traceSamples = s.trace.slice(warmup).filter(x => !Number.isNaN(x));
    if (traceSamples.length > 0) {
      const { median: trMedian, range: trRange } = computeStats(
        traceSamples,
        0,
      );
      report.push({
        name: `${scenario.name} (trace)`,
        unit: 'ms',
        value: Math.round(trMedian * 100) / 100,
        range: trRange,
      });
    }
  }

  if (BENCH_LABEL) {
    for (const entry of report) {
      entry.name += BENCH_LABEL;
    }
  }
  process.stderr.write(`\n── Results (${report.length} metrics) ──\n`);
  for (const entry of report) {
    process.stderr.write(
      `  ${entry.name}: ${entry.value} ${entry.unit} ${entry.range}\n`,
    );
  }
  process.stderr.write('\n');
  process.stdout.write(formatReport(report));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
