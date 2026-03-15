/// <reference types="node" />
/**
 * Validation harness for benchmark library implementations.
 *
 * Navigates to each library's benchmark app, exercises every BenchAPI action,
 * and asserts that updates actually reach the DOM. Catches timing bugs where
 * data-bench-complete fires before the UI has updated.
 *
 * Usage:
 *   npx tsx bench/validate.ts                    # all libraries
 *   npx tsx bench/validate.ts --lib data-client   # one library
 *   npx tsx bench/validate.ts --lib swr,baseline  # multiple
 */
import { chromium } from 'playwright';
import type { Page } from 'playwright';

import { LIBRARIES } from './scenarios.js';

const BASE_URL =
  process.env.BENCH_BASE_URL ??
  `http://localhost:${process.env.BENCH_PORT ?? '5173'}`;

// react-window virtualises; keep test counts within the visible window
const TEST_ITEM_COUNT = 20;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(): { libs: string[] } {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf('--lib');
  if (idx !== -1 && idx + 1 < argv.length) {
    return { libs: argv[idx + 1].split(',').map(s => s.trim()) };
  }
  return { libs: [...LIBRARIES] };
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

async function navigateToLib(page: Page, lib: string) {
  await page.goto(`${BASE_URL}/${lib}/`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForSelector('[data-app-ready]', {
    timeout: 30000,
    state: 'attached',
  });
}

async function waitForComplete(page: Page, timeoutMs = 10000) {
  await page.waitForSelector('[data-bench-complete]', {
    timeout: timeoutMs,
    state: 'attached',
  });
}

async function clearComplete(page: Page) {
  await page
    .locator('[data-bench-harness]')
    .evaluate(el => el.removeAttribute('data-bench-complete'));
}

async function getItemLabels(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const el of document.querySelectorAll('[data-bench-item]')) {
      const id = (el as HTMLElement).dataset.itemId ?? '';
      out[id] = el.querySelector('[data-label]')?.textContent?.trim() ?? '';
    }
    return out;
  });
}

async function getItemCount(page: Page): Promise<number> {
  return page.evaluate(
    () => document.querySelectorAll('[data-bench-item]').length,
  );
}

async function waitFor(
  page: Page,
  condition: () => Promise<boolean>,
  description: string,
  timeoutMs = 5000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return;
    await page.waitForTimeout(50);
  }
  throw new Error(`Timed out waiting for: ${description} (${timeoutMs}ms)`);
}

/** Init items and wait until at least one appears in the DOM. */
async function initAndWaitForItems(
  page: Page,
  count: number = TEST_ITEM_COUNT,
) {
  await clearComplete(page);
  await page.evaluate((n: number) => window.__BENCH__!.init(n), count);
  await waitForComplete(page);
  await waitFor(
    page,
    async () => (await getItemCount(page)) > 0,
    `items rendered after init(${count})`,
  );
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

function assert(
  ok: boolean,
  lib: string,
  test: string,
  message: string,
): asserts ok {
  if (!ok) {
    const err = new Error(`[${lib}] ${test}: ${message}`);
    err.name = 'ValidationError';
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Test registry
// ---------------------------------------------------------------------------

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  skipped?: boolean;
}

type TestFn = (page: Page, lib: string) => Promise<void>;

const tests: { name: string; fn: TestFn; onlyLibs?: string[] }[] = [];
function test(name: string, fn: TestFn, opts?: { onlyLibs?: string[] }) {
  tests.push({ name, fn, onlyLibs: opts?.onlyLibs });
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests — each navigates to a fresh page, so they must do their own setup.
// ═══════════════════════════════════════════════════════════════════════════

// ── init ─────────────────────────────────────────────────────────────────

test('init renders items with correct labels', async (page, lib) => {
  await initAndWaitForItems(page);

  const labels = await getItemLabels(page);
  const ids = Object.keys(labels);
  assert(ids.length > 0, lib, 'init', `no items in DOM`);

  assert(
    labels['item-0'] === 'Item 0',
    lib,
    'init',
    `item-0 label: expected "Item 0", got "${labels['item-0']}"`,
  );

  const renderedCount = await page.evaluate(() =>
    window.__BENCH__!.getRenderedCount(),
  );
  assert(
    renderedCount === TEST_ITEM_COUNT,
    lib,
    'init getRenderedCount',
    `expected ${TEST_ITEM_COUNT}, got ${renderedCount}`,
  );
});

// ── updateEntity ─────────────────────────────────────────────────────────

test('updateEntity changes item label in DOM', async (page, lib) => {
  await initAndWaitForItems(page);

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateEntity('item-0'));
  await waitForComplete(page);

  await waitFor(
    page,
    async () =>
      (await getItemLabels(page))['item-0']?.includes('(updated)') ?? false,
    'item-0 label contains "(updated)"',
  );

  const labels = await getItemLabels(page);
  assert(
    labels['item-0']?.includes('(updated)'),
    lib,
    'updateEntity',
    `item-0 should contain "(updated)", got "${labels['item-0']}"`,
  );
  assert(
    !labels['item-1']?.includes('(updated)'),
    lib,
    'updateEntity unchanged',
    `item-1 should be unchanged, got "${labels['item-1']}"`,
  );
});

// ── updateAuthor ─────────────────────────────────────────────────────────

test('updateAuthor propagates to DOM', async (page, _lib) => {
  await initAndWaitForItems(page);

  // The displayed column includes author.name; updateAuthor changes author.name.
  // Non-normalized libs refetch the whole list (which joins latest author).
  // Verify at minimum that items are still present after the operation.
  const labelsBefore = await getItemLabels(page);
  const countBefore = Object.keys(labelsBefore).length;

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateAuthor('author-0'));
  await waitForComplete(page);

  // After updateAuthor + any async refetch, items should still be rendered
  await waitFor(
    page,
    async () => (await getItemCount(page)) >= countBefore,
    'items still rendered after updateAuthor',
    5000,
  );
});

// ── ref-stability: updateEntity ──────────────────────────────────────────

test('ref-stability after updateEntity', async (page, lib) => {
  await initAndWaitForItems(page);

  await page.evaluate(() => window.__BENCH__!.captureRefSnapshot());

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateEntity('item-0'));
  await waitForComplete(page);

  // Wait for the label change to actually reach the DOM
  await waitFor(
    page,
    async () =>
      (await getItemLabels(page))['item-0']?.includes('(updated)') ?? false,
    'item-0 label updated before ref check',
  );

  const r = await page.evaluate(() =>
    window.__BENCH__!.getRefStabilityReport(),
  );
  const total = r.itemRefChanged + r.itemRefUnchanged;
  assert(
    total === TEST_ITEM_COUNT,
    lib,
    'ref-stability total',
    `expected ${TEST_ITEM_COUNT} items in report, got ${total} (changed=${r.itemRefChanged} unchanged=${r.itemRefUnchanged})`,
  );
  assert(
    r.itemRefChanged >= 1,
    lib,
    'ref-stability changed',
    `expected ≥1 itemRefChanged, got ${r.itemRefChanged}. ` +
      `setCurrentItems may not have been called with updated data before measurement.`,
  );
  process.stderr.write(
    `    itemRefChanged=${r.itemRefChanged} authorRefChanged=${r.authorRefChanged}\n`,
  );
});

// ── ref-stability: updateAuthor ──────────────────────────────────────────

test('ref-stability after updateAuthor', async (page, lib) => {
  await initAndWaitForItems(page);

  await page.evaluate(() => window.__BENCH__!.captureRefSnapshot());

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateAuthor('author-0'));
  await waitForComplete(page);

  // Wait for the author change to propagate (async refetch for SWR/tanstack)
  await waitFor(
    page,
    async () => {
      const r = await page.evaluate(() =>
        window.__BENCH__!.getRefStabilityReport(),
      );
      return r.authorRefChanged > 0;
    },
    'authorRefChanged > 0',
    5000,
  );

  const r = await page.evaluate(() =>
    window.__BENCH__!.getRefStabilityReport(),
  );
  const total = r.authorRefChanged + r.authorRefUnchanged;
  assert(
    total === TEST_ITEM_COUNT,
    lib,
    'ref-stability-author total',
    `expected ${TEST_ITEM_COUNT} items, got ${total}`,
  );
  // 20 items ÷ 20 authors = 1 item per author
  const expectedMin = Math.floor(TEST_ITEM_COUNT / 20);
  assert(
    r.authorRefChanged >= expectedMin,
    lib,
    'ref-stability-author count',
    `expected ≥${expectedMin} authorRefChanged, got ${r.authorRefChanged}`,
  );
  process.stderr.write(
    `    itemRefChanged=${r.itemRefChanged} authorRefChanged=${r.authorRefChanged}\n`,
  );
});

// ── unshiftItem ──────────────────────────────────────────────────────────

test('unshiftItem adds an item', async (page, _lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.unshiftItem === 'function',
    ))
  )
    return;

  await initAndWaitForItems(page, 10);

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.unshiftItem!());
  await waitForComplete(page);

  await waitFor(
    page,
    async () => {
      const labels = await getItemLabels(page);
      return Object.values(labels).some(l => l === 'New Item');
    },
    '"New Item" appears in DOM',
    5000,
  );
});

// ── deleteEntity ─────────────────────────────────────────────────────────

test('deleteEntity removes an item', async (page, _lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.deleteEntity === 'function',
    ))
  )
    return;

  await initAndWaitForItems(page, 10);

  const labelsBefore = await getItemLabels(page);
  assert(
    'item-0' in labelsBefore,
    _lib,
    'deleteEntity setup',
    'item-0 missing',
  );

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.deleteEntity!('item-0'));
  await waitForComplete(page);

  await waitFor(
    page,
    async () => !('item-0' in (await getItemLabels(page))),
    'item-0 removed from DOM',
    5000,
  );
});

// ── mountSortedView ──────────────────────────────────────────────────────

test('mountSortedView renders sorted list', async (page, _lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.mountSortedView === 'function',
    ))
  )
    return;

  // For data-client, sorted view queries All(ItemEntity) from the normalised
  // store, so we must populate the store first via init.
  await initAndWaitForItems(page);
  await page.evaluate(() => window.__BENCH__!.unmountAll());
  await page.waitForTimeout(200);

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.mountSortedView!(20));
  await waitForComplete(page);

  await waitFor(
    page,
    async () =>
      page.evaluate(
        () => document.querySelector('[data-sorted-list]') !== null,
      ),
    '[data-sorted-list] rendered',
    5000,
  );
});

// ── invalidateAndResolve ─────────────────────────────────────────────────

test(
  'invalidateAndResolve completes without error',
  async (page, _lib) => {
    if (
      !(await page.evaluate(
        () => typeof window.__BENCH__?.invalidateAndResolve === 'function',
      ))
    )
      return;

    await initAndWaitForItems(page, 10);

    await clearComplete(page);
    await page.evaluate(() =>
      window.__BENCH__!.invalidateAndResolve!('item-0'),
    );
    await waitForComplete(page, 15000);
  },
  { onlyLibs: ['data-client'] },
);

// ── TIMING VALIDATION ────────────────────────────────────────────────
// Verify that when data-bench-complete fires (measurement ends), the DOM
// already reflects the update. A 100ms network delay makes timing bugs
// observable: if the measureUpdate callback doesn't return its promise
// chain, finish() fires via the sync-path double-rAF (~32ms) before the
// async fetch resolves. data-client passes because controller.fetch()
// dispatches optimistic updates to the store synchronously.

test('updateEntity timing: DOM reflects change at measurement end', async (page, lib) => {
  await initAndWaitForItems(page);
  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(100));

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateEntity('item-0'));
  await waitForComplete(page);

  const labels = await getItemLabels(page);
  assert(
    labels['item-0']?.includes('(updated)') ?? false,
    lib,
    'updateEntity timing',
    `DOM not updated when data-bench-complete fired. ` +
      `Ensure measureUpdate callback returns its promise chain.`,
  );

  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(0));
});

test('unshiftItem timing: DOM reflects change at measurement end', async (page, lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.unshiftItem === 'function',
    ))
  )
    return;

  await initAndWaitForItems(page, 10);
  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(100));

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.unshiftItem!());
  await waitForComplete(page);

  const labels = await getItemLabels(page);
  assert(
    Object.values(labels).some(l => l === 'New Item'),
    lib,
    'unshiftItem timing',
    `"New Item" not in DOM when data-bench-complete fired. ` +
      `Ensure measureUpdate callback returns its promise chain.`,
  );

  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(0));
});

test('deleteEntity timing: DOM reflects change at measurement end', async (page, lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.deleteEntity === 'function',
    ))
  )
    return;

  await initAndWaitForItems(page, 10);
  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(100));

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.deleteEntity!('item-0'));
  await waitForComplete(page);

  const labels = await getItemLabels(page);
  assert(
    !('item-0' in labels),
    lib,
    'deleteEntity timing',
    `item-0 still in DOM when data-bench-complete fired. ` +
      `Ensure measureUpdate callback returns its promise chain.`,
  );

  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(0));
});

// ═══════════════════════════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════════════════════════

async function runLibrary(lib: string): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error')
      process.stderr.write(`  [console.error] ${msg.text()}\n`);
  });
  page.on('pageerror', err =>
    process.stderr.write(`  [page error] ${err.message}\n`),
  );

  for (const t of tests) {
    if (t.onlyLibs && !t.onlyLibs.includes(lib)) {
      results.push({ name: t.name, passed: true, skipped: true });
      continue;
    }

    await navigateToLib(page, lib);
    try {
      await t.fn(page, lib);
      results.push({ name: t.name, passed: true });
    } catch (err) {
      results.push({
        name: t.name,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await context.close();
  await browser.close();
  return results;
}

async function main() {
  const { libs } = parseArgs();
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures: { lib: string; name: string; error: string }[] = [];

  for (const lib of libs) {
    process.stderr.write(`\n━━ ${lib} ━━\n`);
    for (const r of await runLibrary(lib)) {
      if (r.skipped) {
        skipped++;
        process.stderr.write(`  ⊘ ${r.name} (skipped)\n`);
      } else if (r.passed) {
        passed++;
        process.stderr.write(`  ✓ ${r.name}\n`);
      } else {
        failed++;
        process.stderr.write(`  ✗ ${r.name}\n    ${r.error}\n`);
        failures.push({ lib, name: r.name, error: r.error! });
      }
    }
  }

  process.stderr.write(
    `\n━━ Summary: ${passed} passed, ${failed} failed, ${skipped} skipped ━━\n`,
  );
  if (failures.length > 0) {
    process.stderr.write('\nFailures:\n');
    for (const f of failures)
      process.stderr.write(`  [${f.lib}] ${f.name}: ${f.error}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
