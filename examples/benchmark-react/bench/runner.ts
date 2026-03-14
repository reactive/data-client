/// <reference types="node" />
import { chromium } from 'playwright';
import type { Page } from 'playwright';

import { collectMeasures, getMeasureDuration } from './measure.js';
import { collectHeapUsed } from './memory.js';
import { formatReport, type BenchmarkResult } from './report.js';
import {
  SCENARIOS,
  LIBRARIES,
  RUN_CONFIG,
  ACTION_GROUPS,
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

  const libs = libRaw ? libRaw.split(',').map(s => s.trim()) : undefined;
  const size = sizeRaw === 'small' || sizeRaw === 'large' ? sizeRaw : undefined;
  const actions =
    actionRaw ? actionRaw.split(',').map(s => s.trim()) : undefined;

  return { libs, size, actions, scenario: scenarioRaw };
}

function filterScenarios(scenarios: Scenario[]): {
  filtered: Scenario[];
  libraries: string[];
} {
  const { libs, size, actions, scenario: scenarioFilter } = parseArgs();

  let filtered = scenarios;

  // In CI, restrict to data-client hot-path only (existing behavior)
  if (process.env.CI) {
    filtered = filtered.filter(
      s =>
        s.name.startsWith('data-client:') &&
        s.category !== 'withNetwork' &&
        s.category !== 'memory' &&
        s.category !== 'startup',
    );
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

  const libraries = libs ?? (process.env.CI ? ['data-client'] : [...LIBRARIES]);

  return { filtered, libraries };
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

// ---------------------------------------------------------------------------
// Scenario runner (unchanged logic)
// ---------------------------------------------------------------------------

const REF_STABILITY_METRICS = ['itemRefChanged', 'authorRefChanged'] as const;

function isRefStabilityScenario(scenario: Scenario): scenario is Scenario & {
  resultMetric: (typeof REF_STABILITY_METRICS)[number];
} {
  return (
    scenario.resultMetric === 'itemRefChanged' ||
    scenario.resultMetric === 'authorRefChanged'
  );
}

interface ScenarioResult {
  value: number;
  reactCommit?: number;
  traceDuration?: number;
}

async function runScenario(
  page: Page,
  lib: string,
  scenario: Scenario,
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

  const isMemory =
    scenario.action === 'mountUnmountCycle' &&
    scenario.resultMetric === 'heapDelta';
  if (isMemory) {
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send('Performance.enable');
    } catch {
      // best-effort
    }
    const heapBefore = await collectHeapUsed(cdp);
    await (bench as any).evaluate(async (api: any, a: unknown[]) => {
      if (api.mountUnmountCycle)
        await api.mountUnmountCycle(...(a as [number, number]));
    }, scenario.args);
    await page.waitForSelector('[data-bench-complete]', {
      timeout: 60000,
      state: 'attached',
    });
    const heapAfter = await collectHeapUsed(cdp);
    await bench.dispose();
    return { value: heapAfter - heapBefore };
  }

  const isUpdate =
    scenario.action === 'updateEntity' ||
    scenario.action === 'updateAuthor' ||
    scenario.action === 'invalidateAndResolve' ||
    scenario.action === 'createEntity' ||
    scenario.action === 'deleteEntity';
  const isRefStability = isRefStabilityScenario(scenario);
  const isInit = scenario.action === 'init';

  const mountCount = scenario.mountCount ?? 100;
  if (isUpdate || isRefStability) {
    const preMountAction = scenario.preMountAction ?? 'init';
    await harness.evaluate(el => el.removeAttribute('data-bench-complete'));
    await (bench as any).evaluate(
      (api: any, [action, n]: [string, number]) => api[action](n),
      [preMountAction, mountCount],
    );
    await page.waitForSelector('[data-bench-complete]', {
      timeout: 10000,
      state: 'attached',
    });
    await page.evaluate(() => {
      performance.clearMarks();
      performance.clearMeasures();
    });
  }

  if (isRefStability) {
    await (bench as any).evaluate((api: any) => api.captureRefSnapshot());
  }

  await harness.evaluate(el => el.removeAttribute('data-bench-complete'));
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

  if (scenario.networkDelayMs) {
    await (bench as any).evaluate(
      (api: any, ms: number) => api.setNetworkDelay(ms),
      scenario.networkDelayMs,
    );
  }

  await (bench as any).evaluate((api: any, s: any) => {
    api[s.action](...s.args);
  }, scenario);

  const completeTimeout = scenario.networkDelayMs ? 60000 : 10000;
  await page.waitForSelector('[data-bench-complete]', {
    timeout: completeTimeout,
    state: 'attached',
  });

  if (scenario.networkDelayMs) {
    await (bench as any).evaluate((api: any) => api.setNetworkDelay(0));
  }

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
  const isMountLike = isInit || scenario.action === 'mountSortedView';
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
// Startup
// ---------------------------------------------------------------------------

interface StartupMetrics {
  fcp: number;
  taskDuration: number;
}

async function runStartupScenario(
  page: Page,
  lib: string,
): Promise<StartupMetrics> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const appPath = `/${lib}/`;
  await page.goto(`${BASE_URL}${appPath}`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('[data-app-ready]', {
    timeout: 120000,
    state: 'attached',
  });
  const { metrics } = await cdp.send('Performance.getMetrics');
  const fcp =
    metrics.find(
      (m: { name: string; value: number }) => m.name === 'FirstContentfulPaint',
    )?.value ?? 0;
  const taskDuration =
    metrics.find(
      (m: { name: string; value: number }) => m.name === 'TaskDuration',
    )?.value ?? 0;
  return { fcp, taskDuration };
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
  if (
    scenario.resultMetric === 'itemRefChanged' ||
    scenario.resultMetric === 'authorRefChanged'
  )
    return 'count';
  if (scenario.resultMetric === 'heapDelta') return 'bytes';
  return 'ms';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { filtered: SCENARIOS_TO_RUN, libraries } = filterScenarios(SCENARIOS);

  if (SCENARIOS_TO_RUN.length === 0) {
    process.stderr.write('No scenarios matched the filters.\n');
    process.exit(1);
  }

  // Group scenarios by size for differentiated run counts
  const bySize: Record<ScenarioSize, Scenario[]> = { small: [], large: [] };
  for (const s of SCENARIOS_TO_RUN) {
    bySize[s.size ?? 'small'].push(s);
  }
  const sizeGroups = (
    Object.entries(bySize) as [ScenarioSize, Scenario[]][]
  ).filter(([, arr]) => arr.length > 0);

  const results: Record<string, number[]> = {};
  const reactCommitResults: Record<string, number[]> = {};
  const traceResults: Record<string, number[]> = {};
  for (const scenario of SCENARIOS_TO_RUN) {
    results[scenario.name] = [];
    reactCommitResults[scenario.name] = [];
    traceResults[scenario.name] = [];
  }

  const browser = await chromium.launch({ headless: true });

  // Run deterministic scenarios once (no warmup needed)
  const deterministicNames = new Set<string>();
  const deterministicScenarios = SCENARIOS_TO_RUN.filter(s => s.deterministic);
  if (deterministicScenarios.length > 0) {
    process.stderr.write(
      `\n── Deterministic scenarios (${deterministicScenarios.length}) ──\n`,
    );
    for (const lib of libraries) {
      const libScenarios = deterministicScenarios.filter(s =>
        s.name.startsWith(`${lib}:`),
      );
      if (libScenarios.length === 0) continue;
      const context = await browser.newContext();
      const page = await context.newPage();
      for (const scenario of libScenarios) {
        try {
          const result = await runScenario(page, lib, scenario);
          results[scenario.name].push(result.value);
          reactCommitResults[scenario.name].push(result.reactCommit ?? NaN);
          traceResults[scenario.name].push(result.traceDuration ?? NaN);
          process.stderr.write(
            `  ${scenario.name}: ${result.value.toFixed(2)} ${scenarioUnit(scenario)}\n`,
          );
        } catch (err) {
          console.error(
            `  ${scenario.name} FAILED:`,
            err instanceof Error ? err.message : err,
          );
        }
        deterministicNames.add(scenario.name);
      }
      await context.close();
    }
  }

  // Run each size group with adaptive per-scenario convergence
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
      let scenarioDone = 0;
      for (const lib of shuffle([...libraries])) {
        const libScenarios = active.filter(s => s.name.startsWith(`${lib}:`));
        if (libScenarios.length === 0) continue;

        const context = await browser.newContext();
        const page = await context.newPage();

        for (const scenario of libScenarios) {
          try {
            const result = await runScenario(page, lib, scenario);
            results[scenario.name].push(result.value);
            reactCommitResults[scenario.name].push(result.reactCommit ?? NaN);
            traceResults[scenario.name].push(result.traceDuration ?? NaN);
            scenarioDone++;
            process.stderr.write(
              `  [${scenarioDone}/${active.length}] ${scenario.name}: ${result.value.toFixed(2)} ${scenarioUnit(scenario)}${result.reactCommit != null ? ` (commit ${result.reactCommit.toFixed(2)} ms)` : ''}\n`,
            );
          } catch (err) {
            scenarioDone++;
            console.error(
              `  [${scenarioDone}/${active.length}] ${scenario.name} FAILED:`,
              err instanceof Error ? err.message : err,
            );
          }
        }

        await context.close();
      }

      // After each measurement round, check per-scenario convergence
      if (isMeasure) {
        for (const scenario of active) {
          if (
            isConverged(
              results[scenario.name],
              warmup,
              targetMarginPct,
              minMeasurement,
            )
          ) {
            converged.add(scenario.name);
            const nMeasured = results[scenario.name].length - warmup;
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

  // Startup scenarios (fast; only locally)
  const startupResults: Record<string, { fcp: number[]; tbt: number[] }> = {};
  const includeStartup = !process.env.CI;
  if (includeStartup) {
    for (const lib of libraries) {
      startupResults[lib] = { fcp: [], tbt: [] };
    }
    const STARTUP_RUNS = 5;
    for (let round = 0; round < STARTUP_RUNS; round++) {
      process.stderr.write(
        `\n── Startup round ${round + 1}/${STARTUP_RUNS} ──\n`,
      );
      for (const lib of shuffle([...libraries])) {
        const context = await browser.newContext();
        const page = await context.newPage();
        try {
          const m = await runStartupScenario(page, lib);
          startupResults[lib].fcp.push(m.fcp * 1000);
          startupResults[lib].tbt.push(m.taskDuration * 1000);
          process.stderr.write(
            `  ${lib}: fcp ${(m.fcp * 1000).toFixed(2)} ms, task ${(m.taskDuration * 1000).toFixed(2)} ms\n`,
          );
        } catch (err) {
          console.error(
            `  ${lib} startup FAILED:`,
            err instanceof Error ? err.message : err,
          );
        }
        await context.close();
      }
    }
  }

  await browser.close();

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------
  const report: BenchmarkResult[] = [];
  for (const scenario of SCENARIOS_TO_RUN) {
    const samples = results[scenario.name];
    const warmupRuns =
      scenario.deterministic ? 0 : RUN_CONFIG[scenario.size ?? 'small'].warmup;
    if (samples.length <= warmupRuns) continue;
    const { median, range } = computeStats(samples, warmupRuns);
    const unit = scenarioUnit(scenario);
    report.push({
      name: scenario.name,
      unit,
      value: Math.round(median * 100) / 100,
      range,
    });
    const reactSamples = reactCommitResults[scenario.name]
      .slice(warmupRuns)
      .filter(x => !Number.isNaN(x));
    if (
      reactSamples.length > 0 &&
      (scenario.action === 'init' ||
        scenario.action === 'updateEntity' ||
        scenario.action === 'updateAuthor' ||
        scenario.action === 'mountSortedView' ||
        scenario.action === 'invalidateAndResolve' ||
        scenario.action === 'createEntity' ||
        scenario.action === 'deleteEntity')
    ) {
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
    const traceSamples = traceResults[scenario.name]
      .slice(warmupRuns)
      .filter(x => !Number.isNaN(x));
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

  if (includeStartup) {
    for (const lib of libraries) {
      const s = startupResults[lib];
      if (s && s.fcp.length > 0) {
        const fcpStats = computeStats(s.fcp, 0);
        report.push({
          name: `${lib}: startup-fcp`,
          unit: 'ms',
          value: Math.round(fcpStats.median * 100) / 100,
          range: fcpStats.range,
        });
      }
      if (s && s.tbt.length > 0) {
        const tbtStats = computeStats(s.tbt, 0);
        report.push({
          name: `${lib}: startup-task-duration`,
          unit: 'ms',
          value: Math.round(tbtStats.median * 100) / 100,
          range: tbtStats.range,
        });
      }
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
