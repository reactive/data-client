/// <reference types="node" />
/**
 * Browser/page plumbing shared by the hot-path runner (runner.ts) and the GC
 * runner (gc-runner.ts): served app URL, Chromium launch flags, and per-load
 * bench page setup.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';
import type { Browser, BrowserServer, Locator, Page } from 'playwright';

import { NETWORK_SIM_CONFIG } from './scenarios.js';
import type { Scenario } from '../src/shared/types.js';

export const BASE_URL =
  process.env.BENCH_BASE_URL ??
  `http://localhost:${process.env.BENCH_PORT ?? '5173'}`;
const BENCH_V8_TRACE = process.env.BENCH_V8_TRACE === 'true';
export const BENCH_V8_DEOPT = process.env.BENCH_V8_DEOPT === 'true';
export const V8_LOG_DIR = path.resolve('v8-logs');

/** Fresh page load of one library app; waits for `[data-app-ready]` and the harness. */
export async function setupBenchPage(
  page: Page,
  lib: string,
  scenario: Pick<Scenario, 'renderLimit'>,
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

/** Chromium from `launch()` does not expose `process()`; use `launchServer` when piping V8 trace output. */
export async function launchBenchChromium(): Promise<{
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

export function reportV8Logs(): void {
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
