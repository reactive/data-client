/// <reference types="node" />
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';
import type { Browser, BrowserServer, CDPSession, Page } from 'playwright';

import {
  aggregateMeasures,
  collectMeasures,
  getMeasureDuration,
} from './measure.js';
import { collectHeapUsed } from './memory.js';
import { formatReport, type BenchmarkResult } from './report.js';
import {
  SCENARIOS,
  LIBRARIES,
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

  return {
    libs,
    size,
    actions,
    scenario: scenarioRaw,
    networkSim,
  };
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
  /** Durations of `scenario.extraMeasures`, by suffix. */
  extras?: Record<string, number>;
}

interface ScenarioSamples {
  value: number[];
  reactCommit: number[];
  trace: number[];
  extras: Record<string, number[]>;
}

// ---------------------------------------------------------------------------
// Scenario classification and helpers
// ---------------------------------------------------------------------------

/** Metrics read once after the action, from the ref-stability report or the render counts. */
const COUNT_METRICS = [
  'issueRefChanged',
  'userRefChanged',
  'issueRowRenders',
] as const;

function isCountScenario(scenario: Scenario): scenario is Scenario & {
  resultMetric: (typeof COUNT_METRICS)[number];
} {
  return (COUNT_METRICS as readonly unknown[]).includes(scenario.resultMetric);
}

/** Mount-like actions build their own view; the rest update a pre-mounted one. */
function isMountLike(scenario: Scenario): boolean {
  return (
    scenario.action === 'init' ||
    scenario.action === 'mountSortedView' ||
    scenario.action === 'initDoubleList' ||
    scenario.action === 'listDetailSwitch' ||
    scenario.action === 'createEditBrowse' ||
    scenario.action === 'moveThenSwitch'
  );
}

/** Two GCs before a scenario, so allocations from the last one don't carry over. */
async function forceGC(cdp: CDPSession, page: Page): Promise<void> {
  // Best effort: a failed collection only adds variance.
  await cdp.send('HeapProfiler.collectGarbage').catch(() => undefined);
  await page.waitForTimeout(100);
  await cdp.send('HeapProfiler.collectGarbage').catch(() => undefined);
  await page.waitForTimeout(400);
}

async function setupBenchPage(
  page: Page,
  lib: string,
  scenario: Scenario,
  networkSim: boolean,
): Promise<any> {
  await page.goto(`${BASE_URL}/${lib}/`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('[data-app-ready]', {
    timeout: 120000,
    state: 'attached',
  });
  // Without isolation, performance.now() steps by 0.1 ms instead of 5 µs.
  if (!(await page.evaluate(() => crossOriginIsolated))) {
    throw new Error(
      `${BASE_URL} is not cross-origin isolated: serve it with the COOP/COEP headers in serve.json (yarn preview does)`,
    );
  }

  await page.locator('[data-bench-harness]').waitFor({ state: 'attached' });

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

  return bench;
}

async function runPreMount(
  page: Page,
  bench: any,
  scenario: Scenario,
  networkSim: boolean,
): Promise<void> {
  await runAction(
    bench,
    scenario.preMountAction ?? 'init',
    [scenario.mountCount ?? 100],
    actionTimeoutMs(networkSim),
  );
  await page.evaluate(() => {
    performance.clearMarks();
    performance.clearMeasures();
  });
}

function actionTimeoutMs(networkSim: boolean): number {
  return networkSim ? 60000 : 10000;
}

/**
 * Call `api[action](...args)` and wait in the page until the harness signals
 * completion and the action's own promise (if any) settles. One `evaluate`
 * awaits both, so Playwright sends nothing to the page while the action is
 * timed (`waitForSelector` polls the page from its first moment). Rejects if
 * the action rejects, on timeout, or if the harness timed out.
 */
async function runAction(
  bench: any,
  action: string,
  args: unknown[],
  timeoutMs: number,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(new Error(`${action} did not complete within ${timeoutMs} ms`)),
      timeoutMs,
    );
  });
  let timedOut: boolean;
  try {
    timedOut = await Promise.race([
      bench.evaluate(
        async (
          api: any,
          { action, args }: { action: string; args: unknown[] },
        ) => {
          const harness = document.querySelector('[data-bench-harness]')!;
          harness.removeAttribute('data-bench-complete');
          harness.removeAttribute('data-bench-timeout');
          await Promise.all([api.whenComplete(), api[action](...args)]);
          return harness.hasAttribute('data-bench-timeout');
        },
        { action, args },
      ),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
  if (timedOut) {
    throw new Error(
      `Harness timeout during ${action}: MutationObserver did not detect expected DOM update within 30 s`,
    );
  }
}

/** Run one timed iteration: cleanup, invoke action, wait, collect measures. */
async function runIteration(
  page: Page,
  bench: any,
  scenario: Scenario,
  opts: {
    isMountLike: boolean;
    mountCount: number;
    networkSim: boolean;
    subIdx: number;
    shouldTrace: boolean;
  },
): Promise<ScenarioResult> {
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
  await runAction(
    bench,
    scenario.action,
    actionArgs,
    actionTimeoutMs(networkSim),
  );

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
  const { durationMeasure } = scenario;
  const duration =
    durationMeasure ?
      aggregateMeasures(
        measures,
        durationMeasure.measure,
        durationMeasure.aggregate,
      )
    : getMeasureDuration(
        measures,
        isMountLike ? 'mount-duration' : 'update-duration',
      );
  const reactCommit = getMeasureDuration(measures, 'react-commit-update');
  const extras =
    scenario.extraMeasures &&
    Object.fromEntries(
      Object.entries(scenario.extraMeasures).map(
        ([suffix, { measure, aggregate }]) => [
          suffix,
          aggregateMeasures(measures, measure, aggregate),
        ],
      ),
    );

  return {
    value: duration,
    reactCommit: reactCommit > 0 ? reactCommit : undefined,
    traceDuration,
    extras,
  };
}

// ---------------------------------------------------------------------------
// Scenario runner (memory and count scenarios)
// ---------------------------------------------------------------------------

async function runScenario(
  page: Page,
  lib: string,
  scenario: Scenario,
  networkSim: boolean,
): Promise<ScenarioResult> {
  const bench = await setupBenchPage(page, lib, scenario, networkSim);

  // --- Memory ---
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
    await runAction(bench, 'mountUnmountCycle', scenario.args, 60000);
    await (bench as any).evaluate((api: any) => {
      if (api.triggerGC) api.triggerGC();
    });
    await page.waitForTimeout(100);
    const heapAfter = await collectHeapUsed(memoryCdp);
    await bench.dispose();
    return { value: heapAfter - heapBefore };
  }

  if (!isCountScenario(scenario)) {
    throw new Error(
      `${scenario.name}: timing scenarios run in runScenarioConvergent`,
    );
  }

  // --- Counts (deterministic, single run) ---
  await runPreMount(page, bench, scenario, networkSim);
  await (bench as any).evaluate((api: any) => {
    api.captureRefSnapshot();
    api.resetRenderCounts();
  });

  await runAction(
    bench,
    scenario.action,
    scenario.args,
    actionTimeoutMs(networkSim),
  );

  const report = await (bench as any).evaluate((api: any) => ({
    ...api.getRefStabilityReport(),
    ...api.getRenderCounts(),
  }));
  await bench.dispose();
  return { value: report[scenario.resultMetric] as number };
}

// ---------------------------------------------------------------------------
// Convergent scenario runner (single page load, inline stat-sig convergence)
// ---------------------------------------------------------------------------

async function runScenarioConvergent(
  page: Page,
  lib: string,
  scenario: Scenario,
  networkSim: boolean,
  config: ConvergentProfile,
): Promise<ScenarioResult[]> {
  const bench = await setupBenchPage(page, lib, scenario, networkSim);
  const mountLike = isMountLike(scenario);
  const mountCount = scenario.mountCount ?? 100;

  if (!mountLike) await runPreMount(page, bench, scenario, networkSim);

  const totalMax = config.warmup + config.maxMeasurement;
  const results: ScenarioResult[] = [];
  const measurementValues: number[] = [];
  // Trace early in measurement window so early convergence doesn't skip it
  const traceSubIdx = config.warmup + Math.min(1, config.minMeasurement - 1);
  let convergedAt: number | undefined;

  for (let subIdx = 0; subIdx < totalMax; subIdx++) {
    const isWarmup = subIdx < config.warmup;
    const measureIdx = subIdx - config.warmup;

    const shouldTrace = USE_TRACE && subIdx === traceSubIdx;
    const result = await runIteration(page, bench, scenario, {
      isMountLike: mountLike,
      mountCount,
      networkSim,
      subIdx,
      shouldTrace,
    });

    if (isWarmup) continue;

    measurementValues.push(result.value);
    results.push(result);

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
  if (isCountScenario(scenario)) return 'count';
  if (scenario.resultMetric === 'heapDelta') return 'bytes';
  return 'ops/s';
}

function msToOps(ms: number): number {
  return ms > 0 ? 1000 / ms : 0;
}

/** Report the median of `samples` and its margin; nothing when there are none. */
function pushEntry(
  report: BenchmarkResult[],
  name: string,
  unit: string,
  samples: number[],
): void {
  if (samples.length === 0) return;
  const { median, range } = computeStats(samples, 0);
  report.push({ name, unit, value: Math.round(median * 100) / 100, range });
}

/** `pushEntry` in ops/s from durations in ms, skipping NaN (missing) samples. */
function pushOpsEntry(
  report: BenchmarkResult[],
  name: string,
  msSamples: number[],
): void {
  const ms = msSamples.filter(x => !Number.isNaN(x));
  pushEntry(report, name, 'ops/s', ms.map(msToOps));
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
  for (const suffix of Object.keys(scenario.extraMeasures ?? {}))
    (s.extras[suffix] ??= []).push(result.extras?.[suffix] ?? NaN);
}

/** Leading samples to drop: memory rounds start with a warmup; convergent runs drop theirs in place. */
function warmupCount(scenario: Scenario): number {
  return scenario.category === 'memory' ? MEMORY_WARMUP : 0;
}

/** Run each scenario once per matching library (one browser context per lib). */
async function runRound(
  browser: Browser,
  scenarios: Scenario[],
  libs: string[],
  networkSim: boolean,
  samples: Map<string, ScenarioSamples>,
  opts: { shuffleLibs?: boolean } = {},
): Promise<void> {
  const orderedLibs = opts.shuffleLibs ? shuffle([...libs]) : libs;

  for (const lib of orderedLibs) {
    let libScenarios = scenarios.filter(s => s.name.startsWith(`${lib}:`));
    if (libScenarios.length === 0) continue;
    if (opts.shuffleLibs) libScenarios = shuffle(libScenarios);

    const context = await browser.newContext();
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    for (const scenario of libScenarios) {
      await forceGC(cdp, page);

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
          `  ${scenario.name}: ${displayValue}${commitSuffix}\n`,
        );
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
    samples.set(s.name, { value: [], reactCommit: [], trace: [], extras: {} });
  }

  const { browser, closeBenchBrowser } = await launchBenchChromium();
  if (BENCH_V8_DEOPT) {
    process.stderr.write(`V8 profiling logs → ${V8_LOG_DIR}/\n`);
  }

  // Deterministic scenarios: run once, no warmup
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
  }

  // Convergent timing scenarios: single page load with inline convergence
  for (const [size, scenarios] of sizeGroups) {
    // Every deterministic scenario is a count scenario.
    const convergentScenarios = scenarios.filter(s => !s.deterministic);
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
        await forceGC(cdp, page);

        process.stderr.write(`  ${scenario.name}...\n`);
        try {
          const results = await runScenarioConvergent(
            page,
            lib,
            scenario,
            networkSim,
            config,
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
    const values = s.value.slice(warmup);
    pushEntry(
      report,
      scenario.name,
      unit,
      unit === 'ops/s' ? values.map(msToOps) : values,
    );

    // React commit times (only meaningful for duration-based scenarios)
    if (!scenario.resultMetric) {
      pushOpsEntry(
        report,
        `${scenario.name} (react commit)`,
        s.reactCommit.slice(warmup),
      );
    }

    // Extra measures from the same iterations
    for (const [suffix, values] of Object.entries(s.extras)) {
      if (process.env.CI && scenario.extraMeasures?.[suffix]?.ci === false)
        continue;
      pushOpsEntry(report, `${scenario.name}-${suffix}`, values.slice(warmup));
    }

    // Chrome trace durations (opt-in via BENCH_TRACE=true)
    pushOpsEntry(report, `${scenario.name} (trace)`, s.trace.slice(warmup));
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
