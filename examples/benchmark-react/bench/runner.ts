/// <reference types="node" />
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';
import type {
  Browser,
  BrowserServer,
  CDPSession,
  Locator,
  Page,
} from 'playwright';

import { collectMeasures, getMeasureDuration } from './measure.js';
import { collectHeapUsed } from './memory.js';
import { formatReport, type BenchmarkResult } from './report.js';
import {
  SCENARIOS,
  LIBRARIES,
  RUN_CONFIG,
  CONVERGENT_CONFIG,
  ACTION_GROUPS,
  NETWORK_SIM_CONFIG,
} from './scenarios.js';
import type { ConvergentProfile } from './scenarios.js';
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
  opsPerRound?: number;
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
  const opsRaw = get('--ops-per-round', 'BENCH_OPS_PER_ROUND');

  const libs = libRaw ? libRaw.split(',').map(s => s.trim()) : undefined;
  const size = sizeRaw === 'small' || sizeRaw === 'large' ? sizeRaw : undefined;
  const actions =
    actionRaw ? actionRaw.split(',').map(s => s.trim()) : undefined;
  const networkSim =
    networkSimRaw != null ? networkSimRaw !== 'false' : !process.env.CI;
  const opsPerRound = opsRaw ? parseInt(opsRaw, 10) : undefined;

  return {
    libs,
    size,
    actions,
    scenario: scenarioRaw,
    networkSim,
    opsPerRound,
  };
}

function filterScenarios(scenarios: Scenario[]): {
  filtered: Scenario[];
  libraries: string[];
  networkSim: boolean;
  opsPerRound?: number;
} {
  const {
    libs,
    size,
    actions,
    scenario: scenarioFilter,
    networkSim,
    opsPerRound,
  } = parseArgs();

  const libraries = libs ?? (process.env.CI ? ['data-client'] : [...LIBRARIES]);

  let filtered = scenarios;

  // In CI, restrict to data-client hot-path only (existing behavior)
  if (process.env.CI) {
    filtered = filtered.filter(
      s =>
        s.name.startsWith('data-client:') &&
        s.category !== 'memory' &&
        s.category !== 'startup' &&
        !s.deterministic,
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

  return { filtered, libraries, networkSim, opsPerRound };
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
const BENCH_V8_TRACE = process.env.BENCH_V8_TRACE === 'true';
const BENCH_V8_DEOPT = process.env.BENCH_V8_DEOPT === 'true';
const V8_LOG_DIR = path.resolve('v8-logs');
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
// Scenario classification and helpers
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

function isConvergentScenario(scenario: Scenario): boolean {
  return (
    !scenario.deterministic &&
    scenario.category !== 'memory' &&
    scenario.resultMetric !== 'heapDelta' &&
    !isRefStabilityScenario(scenario)
  );
}

function classifyAction(scenario: Scenario): {
  isMountLike: boolean;
  isUpdate: boolean;
} {
  const isMountLike =
    scenario.action === 'init' ||
    scenario.action === 'mountSortedView' ||
    scenario.action === 'initDoubleList' ||
    scenario.action === 'listDetailSwitch';
  return { isMountLike, isUpdate: !isMountLike };
}

async function setupBenchPage(
  page: Page,
  lib: string,
  scenario: Scenario,
  networkSim: boolean,
): Promise<{ harness: Locator; bench: any }> {
  await page.goto(`${BASE_URL}/${lib}/`, {
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
      (api: any, cfg: { baseLatencyMs: number; recordsPerMs: number }) =>
        api.setNetworkSim(cfg),
      NETWORK_SIM_CONFIG,
    );
  }

  if (scenario.renderLimit != null) {
    await (bench as any).evaluate(
      (api: any, n: number) => api.setRenderLimit(n),
      scenario.renderLimit,
    );
  }

  return { harness, bench };
}

async function runPreMount(
  page: Page,
  harness: Locator,
  bench: any,
  scenario: Scenario,
  networkSim: boolean,
): Promise<void> {
  const preMountAction = scenario.preMountAction ?? 'init';
  const mountCount = scenario.mountCount ?? 100;
  await harness.evaluate(el => {
    el.removeAttribute('data-bench-complete');
    el.removeAttribute('data-bench-timeout');
  });
  await (bench as any).evaluate(
    (api: any, [action, n]: [string, number]) => api[action](n),
    [preMountAction, mountCount],
  );
  const preMountTimeout = networkSim ? 60000 : 10000;
  await page.waitForSelector('[data-bench-complete]', {
    timeout: preMountTimeout,
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

/** Run one timed iteration: cleanup, invoke action, wait, collect measures. */
async function runIteration(
  page: Page,
  harness: Locator,
  bench: any,
  scenario: Scenario,
  opts: {
    isMountLike: boolean;
    mountCount: number;
    networkSim: boolean;
    subIdx: number;
    shouldTrace: boolean;
  },
): Promise<{ duration: number; reactCommit: number; traceDuration?: number }> {
  const { isMountLike, mountCount, networkSim, subIdx, shouldTrace } = opts;

  if (subIdx > 0) {
    if (isMountLike) {
      await (bench as any).evaluate((api: any) => api.unmountAll());
      await page
        .waitForSelector('[data-bench-item], [data-sorted-list]', {
          state: 'detached',
          timeout: 10000,
        })
        .catch(() => {});
      await (bench as any).evaluate((api: any) => {
        if (api.resetStore) api.resetStore();
      });
      await page.evaluate(
        () =>
          new Promise<void>(r =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())),
          ),
      );
    } else {
      await (bench as any).evaluate((api: any) => api.flushPendingMutations());
      await page.evaluate(
        () =>
          new Promise<void>(r =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())),
          ),
      );
    }
  }

  await page.evaluate(() => {
    performance.clearMarks();
    performance.clearMeasures();
  });
  await harness.evaluate(el => {
    el.removeAttribute('data-bench-complete');
    el.removeAttribute('data-bench-timeout');
  });

  let cdpTracing: CDPSession | undefined;
  const traceChunks: object[] = [];
  if (shouldTrace) {
    cdpTracing = await page.context().newCDPSession(page);
    cdpTracing.on('Tracing.dataCollected', (params: { value: object[] }) => {
      traceChunks.push(...params.value);
    });
    await cdpTracing.send('Tracing.start', {
      categories: 'devtools.timeline,blink',
    });
  }

  const actionArgs =
    scenario.action === 'deleteEntity' ?
      [Math.min(subIdx + 1, mountCount)]
    : scenario.args;
  await (bench as any).evaluate(
    (api: any, { action, args }: { action: string; args: unknown[] }) => {
      api[action](...args);
    },
    { action: scenario.action, args: actionArgs },
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
  if (shouldTrace && cdpTracing) {
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

  const measures = await collectMeasures(page);
  const duration =
    isMountLike ?
      getMeasureDuration(measures, 'mount-duration')
    : getMeasureDuration(measures, 'update-duration');
  const reactCommit = getMeasureDuration(measures, 'react-commit-update');

  return { duration, reactCommit, traceDuration };
}

// ---------------------------------------------------------------------------
// Scenario runner (memory, ref-stability, and legacy inner loop)
// ---------------------------------------------------------------------------

async function runScenario(
  page: Page,
  lib: string,
  scenario: Scenario,
  networkSim: boolean,
): Promise<ScenarioResult> {
  const { harness, bench } = await setupBenchPage(
    page,
    lib,
    scenario,
    networkSim,
  );

  // --- Memory path (unchanged, always ops=1) ---
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

  const { isMountLike, isUpdate } = classifyAction(scenario);
  const isRefStability = isRefStabilityScenario(scenario);
  const mountCount = scenario.mountCount ?? 100;

  if (isUpdate || isRefStability) {
    await runPreMount(page, harness, bench, scenario, networkSim);
  }

  // --- Ref stability (deterministic, single run, early return) ---
  if (isRefStability) {
    await (bench as any).evaluate((api: any) => api.captureRefSnapshot());

    await harness.evaluate(el => {
      el.removeAttribute('data-bench-complete');
      el.removeAttribute('data-bench-timeout');
    });
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

    const report = await (bench as any).evaluate((api: any) =>
      api.getRefStabilityReport(),
    );
    await bench.dispose();
    return { value: report[scenario.resultMetric!] as number };
  }

  // --- Sub-iteration loop ---
  const ops = effectiveOpsPerRound(scenario);
  const durations: number[] = [];
  const commitTimes: number[] = [];
  const traceDurations: number[] = [];
  const traceSubIdx = Math.floor(ops / 2);

  for (let subIdx = 0; subIdx < ops; subIdx++) {
    const shouldTrace = USE_TRACE && subIdx === traceSubIdx;
    const { duration, reactCommit, traceDuration } = await runIteration(
      page,
      harness,
      bench,
      scenario,
      { isMountLike, mountCount, networkSim, subIdx, shouldTrace },
    );
    durations.push(duration);
    if (reactCommit > 0) commitTimes.push(reactCommit);
    if (traceDuration != null) traceDurations.push(traceDuration);
  }

  await bench.dispose();
  return {
    value: simpleMedian(durations),
    reactCommit: commitTimes.length > 0 ? simpleMedian(commitTimes) : undefined,
    traceDuration:
      traceDurations.length > 0 ? simpleMedian(traceDurations) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Convergent scenario runner (single page load, inline stat-sig convergence)
// ---------------------------------------------------------------------------

const CONVERGENT_GC_INTERVAL = 8;

async function runScenarioConvergent(
  page: Page,
  lib: string,
  scenario: Scenario,
  networkSim: boolean,
  config: ConvergentProfile,
  cdp?: CDPSession,
): Promise<ScenarioResult[]> {
  const { harness, bench } = await setupBenchPage(
    page,
    lib,
    scenario,
    networkSim,
  );
  const { isMountLike, isUpdate } = classifyAction(scenario);
  const mountCount = scenario.mountCount ?? 100;

  if (isUpdate) {
    await runPreMount(page, harness, bench, scenario, networkSim);
  }

  const totalMax = config.warmup + config.maxMeasurement;
  const results: ScenarioResult[] = [];
  const measurementValues: number[] = [];
  // Trace early in measurement window so early convergence doesn't skip it
  const traceSubIdx = config.warmup + Math.min(1, config.minMeasurement - 1);
  let convergedAt: number | undefined;

  for (let subIdx = 0; subIdx < totalMax; subIdx++) {
    const isWarmup = subIdx < config.warmup;
    const measureIdx = subIdx - config.warmup;

    // Periodic double-GC to prevent heap pressure accumulation on long runs
    if (cdp && subIdx > 0 && subIdx % CONVERGENT_GC_INTERVAL === 0) {
      try {
        await cdp.send('HeapProfiler.collectGarbage');
      } catch {}
      await page.waitForTimeout(30);
      try {
        await cdp.send('HeapProfiler.collectGarbage');
      } catch {}
      await page.waitForTimeout(50);
    }

    const shouldTrace = USE_TRACE && subIdx === traceSubIdx;
    const { duration, reactCommit, traceDuration } = await runIteration(
      page,
      harness,
      bench,
      scenario,
      { isMountLike, mountCount, networkSim, subIdx, shouldTrace },
    );

    if (isWarmup) continue;

    measurementValues.push(duration);
    results.push({
      value: duration,
      reactCommit: reactCommit > 0 ? reactCommit : undefined,
      traceDuration,
    });

    if (
      measureIdx + 1 >= config.minMeasurement &&
      isConverged(
        measurementValues,
        0,
        config.targetMarginPct,
        config.minMeasurement,
      )
    ) {
      convergedAt = measureIdx + 1;
      break;
    }
  }

  await bench.dispose();

  if (convergedAt != null) {
    process.stderr.write(
      `    [converged] ${scenario.name} after ${convergedAt} measurements\n`,
    );
  } else {
    process.stderr.write(
      `    [max reached] ${scenario.name} after ${config.maxMeasurement} measurements\n`,
    );
  }

  return results;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function effectiveOpsPerRound(scenario: Scenario): number {
  if (scenario.deterministic) return 1;
  if (scenario.category === 'memory') return 1;
  return (
    scenario.opsPerRound ?? RUN_CONFIG[scenario.size ?? 'small'].opsPerRound
  );
}

function simpleMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ?
      (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Chromium from `launch()` does not expose `process()`; use `launchServer` when piping V8 trace output. */
async function launchBenchChromium(): Promise<{
  browser: Browser;
  closeBenchBrowser: () => Promise<void>;
}> {
  const launchOpts = {
    headless: true,
    args: buildLaunchArgs(),
  };

  if (BENCH_V8_TRACE) {
    const server: BrowserServer = await chromium.launchServer(launchOpts);
    let v8TraceStream: fs.WriteStream | undefined;
    const proc = server.process();
    if (proc?.stderr ?? proc?.stdout) {
      v8TraceStream = fs.createWriteStream('v8-trace.log');
      proc.stderr?.pipe(v8TraceStream, { end: false });
      proc.stdout?.pipe(v8TraceStream, { end: false });
      process.stderr.write(
        'V8 trace output → v8-trace.log (root browser process stderr/stdout)\n',
      );
    } else {
      process.stderr.write(
        'Warning: BENCH_V8_TRACE but browser server process streams unavailable; v8-trace.log may be empty.\n',
      );
    }
    const browser = await chromium.connect({ wsEndpoint: server.wsEndpoint() });
    return {
      browser,
      closeBenchBrowser: async () => {
        await browser.close();
        await server.close();
        if (v8TraceStream) {
          v8TraceStream.end();
          process.stderr.write(
            '\nV8 opt/deopt trace written to v8-trace.log\n',
          );
        }
      },
    };
  }

  const browser = await chromium.launch(launchOpts);
  return {
    browser,
    closeBenchBrowser: () => browser.close(),
  };
}

function buildLaunchArgs(): string[] {
  const args = [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-hang-monitor',
  ];
  const jsFlags: string[] = [];
  if (BENCH_V8_TRACE) {
    jsFlags.push('--trace-opt', '--trace-deopt');
  }
  if (BENCH_V8_DEOPT) {
    fs.rmSync(V8_LOG_DIR, { recursive: true, force: true });
    fs.mkdirSync(V8_LOG_DIR, { recursive: true });
    jsFlags.push('--prof', `--logfile=${V8_LOG_DIR}/v8-%p.log`);
  }
  if (jsFlags.length > 0) args.push(`--js-flags=${jsFlags.join(' ')}`);
  return args;
}

function reportV8Logs(): void {
  if (!BENCH_V8_DEOPT) return;
  try {
    const logs = fs.readdirSync(V8_LOG_DIR).filter(f => f.endsWith('.log'));
    if (logs.length === 0) return;
    process.stderr.write(`\nV8 profiling logs written to ${V8_LOG_DIR}/:\n`);
    for (const log of logs) {
      const size = fs.statSync(path.join(V8_LOG_DIR, log)).size;
      process.stderr.write(`  ${log} (${(size / 1024).toFixed(1)} KB)\n`);
    }
    const largest = logs.reduce((a, b) => {
      const sa = fs.statSync(path.join(V8_LOG_DIR, a)).size;
      const sb = fs.statSync(path.join(V8_LOG_DIR, b)).size;
      return sa >= sb ? a : b;
    });
    process.stderr.write(
      `\nProcess the renderer log (typically the largest file) with:\n` +
        `  node --prof-process ${V8_LOG_DIR}/${largest}\n\n`,
    );
  } catch {
    // best-effort reporting
  }
}

function scenarioUnit(scenario: Scenario): string {
  if (isRefStabilityScenario(scenario)) return 'count';
  if (scenario.resultMetric === 'heapDelta') return 'bytes';
  return 'ops/s';
}

function msToOps(ms: number): number {
  return ms > 0 ? 1000 / ms : 0;
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
  if (isConvergentScenario(scenario)) return 0;
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
      // Double-GC before each scenario to reduce variance from prior allocations
      try {
        await cdp.send('HeapProfiler.collectGarbage');
      } catch {}
      await page.waitForTimeout(100);
      try {
        await cdp.send('HeapProfiler.collectGarbage');
      } catch {}
      await page.waitForTimeout(400);

      done++;
      const prefix = opts.showProgress ? `[${done}/${total}] ` : '';
      try {
        const result = await runScenario(page, lib, scenario, networkSim);
        recordResult(samples, scenario, result);
        const unit = scenarioUnit(scenario);
        const displayValue =
          unit === 'ops/s' ?
            `${msToOps(result.value).toFixed(2)} ops/s`
          : `${result.value.toFixed(2)} ${unit}`;
        const commitSuffix =
          result.reactCommit != null ?
            ` (commit ${msToOps(result.reactCommit).toFixed(2)} ops/s)`
          : '';
        process.stderr.write(
          `  ${prefix}${scenario.name}: ${displayValue}${commitSuffix}\n`,
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
    opsPerRound,
  } = filterScenarios(SCENARIOS);

  if (opsPerRound != null) {
    RUN_CONFIG.small.opsPerRound = opsPerRound;
    RUN_CONFIG.large.opsPerRound = opsPerRound;
  }

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

  const { browser, closeBenchBrowser } = await launchBenchChromium();
  if (BENCH_V8_DEOPT) {
    process.stderr.write(`V8 profiling logs → ${V8_LOG_DIR}/\n`);
  }

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

  // Convergent timing scenarios: single page load with inline convergence
  for (const [size, scenarios] of sizeGroups) {
    const convergentScenarios = scenarios.filter(
      s => !deterministicNames.has(s.name) && isConvergentScenario(s),
    );
    if (convergentScenarios.length === 0) continue;

    const config = CONVERGENT_CONFIG[size];
    process.stderr.write(
      `\n── ${size} convergent (${convergentScenarios.length} scenarios, ${config.warmup} warmup + up to ${config.maxMeasurement} measurements each) ──\n`,
    );

    for (const lib of libraries) {
      const libScenarios = convergentScenarios.filter(s =>
        s.name.startsWith(`${lib}:`),
      );
      if (libScenarios.length === 0) continue;

      const context = await browser.newContext();
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);

      for (const scenario of libScenarios) {
        try {
          await cdp.send('HeapProfiler.collectGarbage');
        } catch {}
        await page.waitForTimeout(100);
        try {
          await cdp.send('HeapProfiler.collectGarbage');
        } catch {}
        await page.waitForTimeout(400);

        process.stderr.write(`  ${scenario.name}...\n`);
        try {
          const results = await runScenarioConvergent(
            page,
            lib,
            scenario,
            networkSim,
            config,
            cdp,
          );
          for (const result of results) {
            recordResult(samples, scenario, result);
          }
        } catch (err) {
          console.error(
            `  ${scenario.name} FAILED:`,
            err instanceof Error ? err.message : err,
          );
        }
      }

      await cdp.detach().catch(() => {});
      await context.close();
    }
  }

  // Outer-loop adaptive rounds for any remaining non-convergent, non-deterministic scenarios
  for (const [size, scenarios] of sizeGroups) {
    const { warmup, minMeasurement, maxMeasurement, targetMarginPct } =
      RUN_CONFIG[size];
    const outerLoopScenarios = scenarios.filter(
      s => !deterministicNames.has(s.name) && !isConvergentScenario(s),
    );
    if (outerLoopScenarios.length === 0) continue;

    const maxRounds = warmup + maxMeasurement;
    const converged = new Set<string>();

    for (let round = 0; round < maxRounds; round++) {
      const isMeasure = round >= warmup;
      const phase = isMeasure ? 'measure' : 'warmup';
      const phaseRound = isMeasure ? round - warmup + 1 : round + 1;
      const phaseTotal = isMeasure ? maxMeasurement : warmup;
      const active = outerLoopScenarios.filter(s => !converged.has(s.name));
      if (active.length === 0) break;

      process.stderr.write(
        `\n── ${size} round ${round + 1}/${maxRounds} (${phase} ${phaseRound}/${phaseTotal}, ${active.length}/${outerLoopScenarios.length} active) ──\n`,
      );

      await runRound(browser, active, libraries, networkSim, samples, {
        shuffleLibs: true,
        showProgress: true,
      });

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
        if (converged.size === outerLoopScenarios.length) {
          process.stderr.write(
            `\n── All ${size} outer-loop scenarios converged, stopping early ──\n`,
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

  await closeBenchBrowser();
  reportV8Logs();

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------
  const report: BenchmarkResult[] = [];
  for (const scenario of SCENARIOS_TO_RUN) {
    const s = samples.get(scenario.name)!;
    const warmup = warmupCount(scenario);
    if (s.value.length <= warmup) continue;

    const unit = scenarioUnit(scenario);
    const isOps = unit === 'ops/s';
    const statSamples =
      isOps ? s.value.slice(warmup).map(msToOps) : s.value.slice(warmup);
    const { median, range } = computeStats(statSamples, 0);
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
      const rcOps = reactSamples.map(msToOps);
      const { median: rcMedian, range: rcRange } = computeStats(rcOps, 0);
      report.push({
        name: `${scenario.name} (react commit)`,
        unit: 'ops/s',
        value: Math.round(rcMedian * 100) / 100,
        range: rcRange,
      });
    }

    // Chrome trace durations (opt-in via BENCH_TRACE=true)
    const traceSamples = s.trace.slice(warmup).filter(x => !Number.isNaN(x));
    if (traceSamples.length > 0) {
      const trOps = traceSamples.map(msToOps);
      const { median: trMedian, range: trRange } = computeStats(trOps, 0);
      report.push({
        name: `${scenario.name} (trace)`,
        unit: 'ops/s',
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
