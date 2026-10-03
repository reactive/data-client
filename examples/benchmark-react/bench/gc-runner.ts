/// <reference types="node" />
/**
 * Browser GC runner (data-client only): isolated cache-GC interaction
 * measurement via the lazy gc-browser-harness chunk. Separate from the
 * hot-path runner (runner.ts); shares page/browser plumbing (browser.ts) and
 * the GC protocol/fixture (examples/gc-shared) with the Node/Android harnesses.
 *
 *   yarn bench:gc [--samples N] [--scenario FILTER]
 *
 * --samples / BENCH_GC_SAMPLES   samples per scenario (default 5)
 * --scenario / BENCH_SCENARIO    slash-bounded segments of the stable id
 *   browser/{kind}/{pattern}/{count}/end-to-end/{control}, or ^prefix
 *   (e.g. `100000`, `entity/unique/100000`, `/1000/`)
 *
 * Writes the detailed report (BENCH_GC_OUTPUT, default
 * gc-measurement-output.json); exits 1 when the report is incomplete.
 */
import * as fs from 'node:fs';
import type { Browser, CDPSession, Page } from 'playwright';

import { BASE_URL, launchBenchChromium, setupBenchPage } from './browser.js';
import {
  MANIFEST_FILENAME,
  MANIFEST_PATH,
  readBuildManifest,
  verifyLocalManifest,
  type BuildManifestV1,
} from './build-manifest.js';
import {
  buildGCReport,
  scenarioReportFromConfig,
  writeGCReport,
  type GCFailureRecord,
  type GCSampleResult,
  type GCScenarioReport,
} from './gc-report.js';
import { collectHeapUsed } from './memory.js';
import type { ScenarioDescriptor } from '../../gc-shared/protocol.js';
import { listScenarios } from '../../gc-shared/protocol.js';
import type {
  GCBrowserMeasurement,
  GCScenarioConfig,
} from '../src/shared/types.js';

type GCScenarioDescriptor = ScenarioDescriptor & GCScenarioConfig;

function parseArgs(): { samples: number; filter: string | null } {
  const argv = process.argv.slice(2);
  const get = (flag: string, envVar: string): string | undefined => {
    const idx = argv.indexOf(flag);
    if (idx !== -1 && idx + 1 < argv.length) return argv[idx + 1];
    return process.env[envVar] || undefined;
  };

  const samplesRaw = get('--samples', 'BENCH_GC_SAMPLES') ?? '5';
  const samples = Number.parseInt(samplesRaw, 10);
  if (!Number.isFinite(samples) || !Number.isInteger(samples) || samples < 1) {
    throw new Error(
      `invalid --samples / BENCH_GC_SAMPLES=${JSON.stringify(samplesRaw)}; expected integer ≥ 1`,
    );
  }
  return { samples, filter: get('--scenario', 'BENCH_SCENARIO') ?? null };
}

async function settlePage(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>(r =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  await page.waitForTimeout(50);
}

async function verifyGCBuildProvenance(
  baseUrl: string,
): Promise<BuildManifestV1 & { servedManifestBuildId: string }> {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Missing ${MANIFEST_FILENAME}. Run yarn build (writes BuildManifest v1 after webpack).`,
    );
  }
  const local = readBuildManifest();
  verifyLocalManifest(local);

  const servedUrl = `${baseUrl.replace(/\/$/, '')}/${MANIFEST_FILENAME}`;
  const res = await fetch(servedUrl);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch served ${MANIFEST_FILENAME} from ${servedUrl}: ${res.status}`,
    );
  }
  const served = (await res.json()) as BuildManifestV1;
  if (served.schemaVersion !== 1) {
    throw new Error(`served manifest schemaVersion ${served.schemaVersion}`);
  }
  if (served.buildId !== local.buildId) {
    throw new Error(
      `served manifest buildId mismatch (local ${local.buildId.slice(0, 12)}… vs served ${served.buildId.slice(0, 12)}…). Restart preview after rebuild.`,
    );
  }
  process.stderr.write(
    `GC provenance OK buildId=${local.buildId.slice(0, 16)}… commit=${local.commit.slice(0, 8)} dirty=${local.dirty}\n`,
  );
  return { ...local, servedManifestBuildId: served.buildId };
}

/**
 * Dedicated GC phase (not the generic convergent/update path).
 * Per sample: prepare → engine GC + heapBefore → run → settle → engine GC +
 * heapAfter (store live) → dispose. Never force engine GC inside interaction timing.
 * Failures are accumulated; report is always written with complete true/false;
 * returns { reports, complete } and caller must exit nonzero when incomplete.
 */
async function runGCScenarioSample(
  page: Page,
  bench: any,
  config: GCScenarioConfig,
  cdp: CDPSession,
): Promise<GCSampleResult> {
  await (bench as any).evaluate(async (api: any, cfg: GCScenarioConfig) => {
    if (!api.prepareGCScenario) {
      throw new Error('prepareGCScenario not available');
    }
    await api.prepareGCScenario(cfg);
  }, config);

  // Forced engine GC + heapBefore (outside interaction timing)
  const heapBeforeBytes = await collectHeapUsed(cdp);

  const measurement: GCBrowserMeasurement = await (bench as any).evaluate(
    async (api: any) => {
      if (!api.runGCScenario) {
        throw new Error('runGCScenario not available');
      }
      return api.runGCScenario();
    },
  );

  await settlePage(page);

  // Forced engine GC + heapAfter while store remains live
  const heapAfterBytes = await collectHeapUsed(cdp);

  await (bench as any).evaluate((api: any) => {
    if (api.disposeGCScenario) api.disposeGCScenario();
  });

  return {
    ...measurement,
    heapBeforeBytes,
    heapAfterBytes,
    heapDeltaBytes: heapAfterBytes - heapBeforeBytes,
  };
}

async function runGCPhase(
  browser: Browser,
  scenarios: GCScenarioDescriptor[],
  sampleCount: number,
  scenarioFilter: string | null,
  provenance: BuildManifestV1 & { servedManifestBuildId: string },
): Promise<{ reports: GCScenarioReport[]; complete: boolean }> {
  const reports: GCScenarioReport[] = [];
  const failures: GCFailureRecord[] = [];
  const requestedScenarios = scenarios.length;
  const requestedSamples = scenarios.length * sampleCount;
  let completedSamples = 0;

  if (scenarios.length === 0) {
    return { reports, complete: true };
  }

  process.stderr.write(
    `\n── GC (${scenarios.length} scenarios, ${sampleCount} samples each) ──\n`,
  );

  const context = await browser.newContext();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  try {
    await cdp.send('Performance.enable');
  } catch {
    // best-effort
  }

  for (const {
    id: scenarioId,
    candidateKind,
    pattern,
    count,
    control,
  } of scenarios) {
    const config: GCScenarioConfig = { candidateKind, pattern, count, control };
    const scenarioSamples: GCSampleResult[] = [];
    let scenarioFailed = false;

    process.stderr.write(`  ${scenarioId}...\n`);

    for (let i = 0; i < sampleCount; i++) {
      try {
        // Fresh page load per sample isolates heap between samples
        const { bench } = await setupBenchPage(page, 'data-client', {}, false);
        const sample = await runGCScenarioSample(page, bench, config, cdp);
        scenarioSamples.push(sample);
        completedSamples++;
        await bench.dispose();
      } catch (err) {
        scenarioFailed = true;
        const message = err instanceof Error ? err.message : String(err);
        failures.push({
          scenarioId,
          sampleIndex: i,
          error: message,
        });
        console.error(`  ${scenarioId} sample ${i} FAILED:`, message);
        try {
          await page.evaluate(() => {
            window.__BENCH__?.disposeGCScenario?.();
          });
        } catch {
          // ignore cleanup failures
        }
        break;
      }
    }

    if (!scenarioFailed && scenarioSamples.length === sampleCount) {
      const report = scenarioReportFromConfig(config, scenarioSamples);
      const { summary } = report;
      const medianTotal = summary.totalMs?.median ?? 0;
      const maxFrame =
        summary.frameIntervalsMs?.max ?? summary.frameIntervalsMs?.median;
      process.stderr.write(
        `    median totalMs=${medianTotal.toFixed(3)} ms` +
          (summary.timerDelayMs ?
            ` timerDelay=${summary.timerDelayMs.median.toFixed(2)} ms`
          : '') +
          (summary.displayPeriodMs ?
            ` displayPeriod=${summary.displayPeriodMs.median.toFixed(2)} ms`
          : '') +
          (maxFrame != null ?
            ` frameIntervalMax=${maxFrame.toFixed(2)} ms`
          : '') +
          (summary.maxInputDelayMs ?
            ` maxInputDelay=${summary.maxInputDelayMs.median.toFixed(2)} ms`
          : '') +
          (summary.missedFrames != null ?
            ` missedFrames=${summary.missedFrames.median}`
          : '') +
          (summary.longTaskCount ?
            ` longTasks=${summary.longTaskCount.median}` +
            (summary.longTaskTotalMs ?
              `/${summary.longTaskTotalMs.median.toFixed(2)} ms`
            : '')
          : '') +
          (summary.heapDeltaBytes ?
            ` heapΔ=${Math.round(summary.heapDeltaBytes.median)} B`
          : '') +
          `\n`,
      );
      reports.push(report);
    }
  }

  await cdp.detach().catch(() => {});
  await context.close();

  const version = browser.version();
  const report = buildGCReport({
    scenarios: reports,
    samplesPerScenario: sampleCount,
    filter: scenarioFilter,
    browserVersion: version,
    headless: true,
    requestedScenarios,
    requestedSamples,
    completedScenarios: reports.length,
    completedSamples,
    failures,
    provenance,
  });
  writeGCReport(report);

  if (!report.complete) {
    process.stderr.write(
      `GC phase incomplete: ${failures.length} failure(s), completed ${completedSamples}/${requestedSamples} samples\n`,
    );
  }

  return { reports, complete: report.complete };
}

async function main() {
  const { samples, filter } = parseArgs();
  const scenarios = listScenarios('browser', {
    filter: filter ?? undefined,
  }) as GCScenarioDescriptor[];
  if (scenarios.length === 0) {
    process.stderr.write(
      `No GC scenarios matched --scenario ${JSON.stringify(filter)}.\n`,
    );
    process.exit(1);
  }

  // Fail fast on a stale build before launching the browser
  const provenance = await verifyGCBuildProvenance(BASE_URL);

  const { browser, closeBenchBrowser } = await launchBenchChromium();
  let complete = false;
  try {
    ({ complete } = await runGCPhase(
      browser,
      scenarios,
      samples,
      filter,
      provenance,
    ));
  } finally {
    await closeBenchBrowser();
  }

  if (!complete) process.exitCode = 1;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
