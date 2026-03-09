/// <reference types="node" />
import { chromium } from 'playwright';
import type { Page } from 'playwright';

import { collectMeasures, getMeasureDuration } from './measure.js';
import { collectHeapUsed } from './memory.js';
import { formatReport, type BenchmarkResult } from './report.js';
import {
  SCENARIOS,
  WARMUP_RUNS,
  MEASUREMENT_RUNS,
  LIBRARIES,
} from './scenarios.js';
import { computeStats } from './stats.js';
import { parseTraceDuration } from './tracing.js';

const BASE_URL = process.env.BENCH_BASE_URL ?? 'http://localhost:5173';
/** In CI we only run hot-path scenarios; with-network and memory are for local comparison. */
const SCENARIOS_TO_RUN =
  process.env.CI ?
    SCENARIOS.filter(
      s => s.category !== 'withNetwork' && s.category !== 'memory',
    )
  : SCENARIOS;
const TOTAL_RUNS = WARMUP_RUNS + MEASUREMENT_RUNS;

const REF_STABILITY_METRICS = ['itemRefChanged', 'authorRefChanged'] as const;

function isRefStabilityScenario(
  scenario: (typeof SCENARIOS_TO_RUN)[0],
): scenario is (typeof SCENARIOS_TO_RUN)[0] & {
  resultMetric: (typeof REF_STABILITY_METRICS)[number];
} {
  return (
    scenario.resultMetric === 'itemRefChanged' ||
    scenario.resultMetric === 'authorRefChanged'
  );
}

const USE_TRACE = process.env.BENCH_TRACE === 'true';

interface ScenarioResult {
  value: number;
  reactCommit?: number;
  traceDuration?: number;
}

async function runScenario(
  page: Page,
  lib: string,
  scenario: (typeof SCENARIOS_TO_RUN)[0],
): Promise<ScenarioResult> {
  const appPath = `/${lib}/`;
  await page.goto(`${BASE_URL}${appPath}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-app-ready]', {
    timeout: 10000,
    state: 'attached',
  });

  const harness = page.locator('[data-bench-harness]');
  await harness.waitFor({ state: 'attached' });

  const bench = await page.evaluateHandle('window.__BENCH__');
  if (!bench) throw new Error('window.__BENCH__ not found');

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
    scenario.action === 'optimisticUpdate';
  const isRefStability = isRefStabilityScenario(scenario);
  const isBulkIngest = scenario.action === 'bulkIngest';

  const mountCount =
    scenario.mountCount ?? (scenario.action === 'optimisticUpdate' ? 1 : 100);
  if (isUpdate || isRefStability) {
    await harness.evaluate(el => el.removeAttribute('data-bench-complete'));
    await (bench as any).evaluate(
      (api: any, n: number) => api.mount(n),
      mountCount,
    );
    await page.waitForSelector('[data-bench-complete]', {
      timeout: 5000,
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
  if (USE_TRACE && !isRefStability) {
    await (page as any).tracing.start({
      categories: ['devtools.timeline', 'blink'],
    });
  }
  await (bench as any).evaluate((api: any, s: any) => {
    api[s.action](...s.args);
  }, scenario);

  await page.waitForSelector('[data-bench-complete]', {
    timeout: 10000,
    state: 'attached',
  });

  let traceDuration: number | undefined;
  if (USE_TRACE && !isRefStability) {
    try {
      const buf = await (page as any).tracing.stop();
      traceDuration = parseTraceDuration(buf);
    } catch {
      traceDuration = undefined;
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
  const isMountLike = scenario.action === 'mount' || isBulkIngest;
  const duration =
    isMountLike ?
      getMeasureDuration(measures, 'mount-duration')
    : getMeasureDuration(measures, 'update-duration');
  const reactCommit =
    isMountLike ?
      getMeasureDuration(measures, 'react-commit-mount')
    : getMeasureDuration(measures, 'react-commit-update');

  await bench.dispose();
  return {
    value: duration,
    reactCommit: reactCommit > 0 ? reactCommit : undefined,
    traceDuration,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function main() {
  const results: Record<string, number[]> = {};
  const reactCommitResults: Record<string, number[]> = {};
  const traceResults: Record<string, number[]> = {};
  for (const scenario of SCENARIOS_TO_RUN) {
    results[scenario.name] = [];
    reactCommitResults[scenario.name] = [];
    traceResults[scenario.name] = [];
  }

  const browser = await chromium.launch({ headless: true });
  const libraries = [...LIBRARIES];

  for (let round = 0; round < TOTAL_RUNS; round++) {
    for (const lib of shuffle(libraries)) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      } catch {
        // CDP throttling is best-effort
      }

      for (const scenario of SCENARIOS_TO_RUN) {
        if (!scenario.name.startsWith(`${lib}:`)) continue;
        try {
          const result = await runScenario(page, lib, scenario);
          results[scenario.name].push(result.value);
          reactCommitResults[scenario.name].push(result.reactCommit ?? NaN);
          traceResults[scenario.name].push(result.traceDuration ?? NaN);
        } catch (err) {
          console.error(
            `Scenario ${scenario.name} failed:`,
            err instanceof Error ? err.message : err,
          );
        }
      }

      await context.close();
    }
  }

  await browser.close();

  const report: BenchmarkResult[] = [];
  for (const scenario of SCENARIOS_TO_RUN) {
    const samples = results[scenario.name];
    if (samples.length === 0) continue;
    const { median, range } = computeStats(samples, WARMUP_RUNS);
    let unit = 'ms';
    if (
      scenario.resultMetric === 'itemRefChanged' ||
      scenario.resultMetric === 'authorRefChanged'
    ) {
      unit = 'count';
    } else if (scenario.resultMetric === 'heapDelta') {
      unit = 'bytes';
    }
    report.push({
      name: scenario.name,
      unit,
      value: Math.round(median * 100) / 100,
      range,
    });
    const reactSamples = reactCommitResults[scenario.name]
      .slice(WARMUP_RUNS)
      .filter(x => !Number.isNaN(x));
    if (
      reactSamples.length > 0 &&
      (scenario.action === 'mount' ||
        scenario.action === 'updateEntity' ||
        scenario.action === 'updateAuthor' ||
        scenario.action === 'optimisticUpdate' ||
        scenario.action === 'bulkIngest')
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
      .slice(WARMUP_RUNS)
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

  process.stdout.write(formatReport(report));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
