/// <reference types="node" />
import { chromium } from 'playwright';
import type { Page } from 'playwright';

import { collectMeasures, getMeasureDuration } from './measure.js';
import { formatReport, type BenchmarkResult } from './report.js';
import {
  SCENARIOS,
  WARMUP_RUNS,
  MEASUREMENT_RUNS,
  LIBRARIES,
} from './scenarios.js';
import { computeStats } from './stats.js';

const BASE_URL = process.env.BENCH_BASE_URL ?? 'http://localhost:5173';
/** In CI we only run hot-path scenarios; with-network is for local comparison. */
const SCENARIOS_TO_RUN =
  process.env.CI ?
    SCENARIOS.filter(s => s.category !== 'withNetwork')
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

async function runScenario(
  page: Page,
  lib: string,
  scenario: (typeof SCENARIOS_TO_RUN)[0],
): Promise<number> {
  const appPath = '/';
  await page.goto(`${BASE_URL}${appPath}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-app-ready]', {
    timeout: 10000,
    state: 'attached',
  });

  const harness = page.locator('[data-bench-harness]');
  await harness.waitFor({ state: 'attached' });

  const bench = await page.evaluateHandle('window.__BENCH__');
  if (!bench) throw new Error('window.__BENCH__ not found');

  const isUpdate =
    scenario.action === 'updateEntity' || scenario.action === 'updateAuthor';
  const isRefStability = isRefStabilityScenario(scenario);

  if (isUpdate || isRefStability) {
    await harness.evaluate(el => el.removeAttribute('data-bench-complete'));
    await (bench as any).evaluate((api: any) => api.mount(100));
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
  await (bench as any).evaluate((api: any, s: any) => {
    api[s.action](...s.args);
  }, scenario);

  await page.waitForSelector('[data-bench-complete]', {
    timeout: 10000,
    state: 'attached',
  });

  if (isRefStability && scenario.resultMetric) {
    const report = await (bench as any).evaluate((api: any) =>
      api.getRefStabilityReport(),
    );
    await bench.dispose();
    return report[scenario.resultMetric] as number;
  }

  const measures = await collectMeasures(page);
  const duration =
    scenario.action === 'mount' ?
      getMeasureDuration(measures, 'mount-duration')
    : getMeasureDuration(measures, 'update-duration');

  await bench.dispose();
  return duration;
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
  for (const scenario of SCENARIOS_TO_RUN) {
    results[scenario.name] = [];
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
          const duration = await runScenario(page, lib, scenario);
          results[scenario.name].push(duration);
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
    const unit =
      (
        scenario.resultMetric === 'itemRefChanged' ||
        scenario.resultMetric === 'authorRefChanged'
      ) ?
        'count'
      : 'ms';
    report.push({
      name: scenario.name,
      unit,
      value: Math.round(median * 100) / 100,
      range,
    });
  }

  process.stdout.write(formatReport(report));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
