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
 *   npx tsx bench/validate.ts --lib swr,tanstack-query  # multiple
 */
import { chromium } from 'playwright';
import type { Page } from 'playwright';

import { LIBRARIES } from './scenarios.js';

const BASE_URL =
  process.env.BENCH_BASE_URL ??
  `http://localhost:${process.env.BENCH_PORT ?? '5173'}`;

const TEST_ISSUE_COUNT = 20;

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

async function getIssueTitles(page: Page): Promise<Record<number, string>> {
  return page.evaluate(() => {
    const out: Record<number, string> = {};
    for (const el of document.querySelectorAll('[data-bench-item]')) {
      const num = Number((el as HTMLElement).dataset.issueNumber ?? '0');
      out[num] = el.querySelector('[data-title]')?.textContent?.trim() ?? '';
    }
    return out;
  });
}

async function getIssueCount(page: Page): Promise<number> {
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

/** Init issues and wait until at least one appears in the DOM. */
async function initAndWaitForIssues(
  page: Page,
  count: number = TEST_ISSUE_COUNT,
) {
  await clearComplete(page);
  await page.evaluate((n: number) => window.__BENCH__!.init(n), count);
  await waitForComplete(page);
  await waitFor(
    page,
    async () => (await getIssueCount(page)) > 0,
    `issues rendered after init(${count})`,
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

test('init renders issues with correct titles', async (page, lib) => {
  await initAndWaitForIssues(page);

  const titles = await getIssueTitles(page);
  const nums = Object.keys(titles).map(Number);
  assert(nums.length > 0, lib, 'init', `no issues in DOM`);

  // Issue #1 is the first generated issue
  assert(
    titles[1] != null && titles[1].length > 0,
    lib,
    'init',
    `issue #1 title missing or empty, got "${titles[1]}"`,
  );

  const renderedCount = await page.evaluate(() =>
    window.__BENCH__!.getRenderedCount(),
  );
  assert(
    renderedCount === TEST_ISSUE_COUNT,
    lib,
    'init getRenderedCount',
    `expected ${TEST_ISSUE_COUNT}, got ${renderedCount}`,
  );
});

// ── updateEntity ─────────────────────────────────────────────────────────

test('updateEntity changes issue title in DOM', async (page, lib) => {
  await initAndWaitForIssues(page);

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateEntity(1));
  await waitForComplete(page);

  await waitFor(
    page,
    async () => (await getIssueTitles(page))[1]?.includes('(updated)') ?? false,
    'issue #1 title contains "(updated)"',
  );

  const titles = await getIssueTitles(page);
  assert(
    titles[1]?.includes('(updated)'),
    lib,
    'updateEntity',
    `issue #1 should contain "(updated)", got "${titles[1]}"`,
  );
  assert(
    !titles[2]?.includes('(updated)'),
    lib,
    'updateEntity unchanged',
    `issue #2 should be unchanged, got "${titles[2]}"`,
  );
});

// ── updateUser ───────────────────────────────────────────────────────────

test('updateUser propagates to DOM', async (page, _lib) => {
  await initAndWaitForIssues(page);

  const titlesBefore = await getIssueTitles(page);
  const countBefore = Object.keys(titlesBefore).length;

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateUser('user0'));
  await waitForComplete(page);

  await waitFor(
    page,
    async () => (await getIssueCount(page)) >= countBefore,
    'issues still rendered after updateUser',
    5000,
  );
});

// ── ref-stability: updateEntity ──────────────────────────────────────────

test('ref-stability after updateEntity', async (page, lib) => {
  await initAndWaitForIssues(page);

  await page.evaluate(() => window.__BENCH__!.captureRefSnapshot());

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateEntity(1));
  await waitForComplete(page);

  await waitFor(
    page,
    async () => (await getIssueTitles(page))[1]?.includes('(updated)') ?? false,
    'issue #1 title updated before ref check',
  );

  const r = await page.evaluate(() =>
    window.__BENCH__!.getRefStabilityReport(),
  );
  const total = r.issueRefChanged + r.issueRefUnchanged;
  assert(
    total === TEST_ISSUE_COUNT,
    lib,
    'ref-stability total',
    `expected ${TEST_ISSUE_COUNT} issues in report, got ${total} (changed=${r.issueRefChanged} unchanged=${r.issueRefUnchanged})`,
  );
  assert(
    r.issueRefChanged >= 1,
    lib,
    'ref-stability changed',
    `expected ≥1 issueRefChanged, got ${r.issueRefChanged}. ` +
      `setCurrentIssues may not have been called with updated data before measurement.`,
  );
  process.stderr.write(
    `    issueRefChanged=${r.issueRefChanged} userRefChanged=${r.userRefChanged}\n`,
  );
});

// ── ref-stability: updateUser ────────────────────────────────────────────

test('ref-stability after updateUser', async (page, lib) => {
  await initAndWaitForIssues(page);

  await page.evaluate(() => window.__BENCH__!.captureRefSnapshot());

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateUser('user0'));
  await waitForComplete(page);

  await waitFor(
    page,
    async () => {
      const r = await page.evaluate(() =>
        window.__BENCH__!.getRefStabilityReport(),
      );
      return r.userRefChanged > 0;
    },
    'userRefChanged > 0',
    5000,
  );

  const r = await page.evaluate(() =>
    window.__BENCH__!.getRefStabilityReport(),
  );
  const total = r.userRefChanged + r.userRefUnchanged;
  assert(
    total === TEST_ISSUE_COUNT,
    lib,
    'ref-stability-user total',
    `expected ${TEST_ISSUE_COUNT} issues, got ${total}`,
  );
  // 20 issues ÷ 20 users = 1 issue per user
  const expectedMin = Math.floor(TEST_ISSUE_COUNT / 20);
  assert(
    r.userRefChanged >= expectedMin,
    lib,
    'ref-stability-user count',
    `expected ≥${expectedMin} userRefChanged, got ${r.userRefChanged}`,
  );
  process.stderr.write(
    `    issueRefChanged=${r.issueRefChanged} userRefChanged=${r.userRefChanged}\n`,
  );
});

// ── unshiftItem ──────────────────────────────────────────────────────────

test('unshiftItem adds an issue', async (page, _lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.unshiftItem === 'function',
    ))
  )
    return;

  await initAndWaitForIssues(page, 10);

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.unshiftItem!());
  await waitForComplete(page);

  await waitFor(
    page,
    async () => {
      const titles = await getIssueTitles(page);
      return Object.values(titles).some(t => t === 'New Issue');
    },
    '"New Issue" appears in DOM',
    5000,
  );
});

// ── deleteEntity ─────────────────────────────────────────────────────────

test('deleteEntity removes an issue', async (page, _lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.deleteEntity === 'function',
    ))
  )
    return;

  await initAndWaitForIssues(page, 10);

  const titlesBefore = await getIssueTitles(page);
  assert(1 in titlesBefore, _lib, 'deleteEntity setup', 'issue #1 missing');

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.deleteEntity!(1));
  await waitForComplete(page);

  await waitFor(
    page,
    async () => !(1 in (await getIssueTitles(page))),
    'issue #1 removed from DOM',
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

  // For data-client, sorted view queries All(IssueEntity) from the normalised
  // store, so we must populate the store first via init.
  await initAndWaitForIssues(page);
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

    await initAndWaitForIssues(page, 10);

    await clearComplete(page);
    await page.evaluate(() => window.__BENCH__!.invalidateAndResolve!(1));
    await waitForComplete(page, 15000);
  },
  { onlyLibs: ['data-client'] },
);

// ── moveItem ─────────────────────────────────────────────────────────

test('moveItem moves issue between state lists', async (page, lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.moveItem === 'function',
    ))
  )
    return;

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.initDoubleList!(20));
  await waitForComplete(page);

  await waitFor(
    page,
    async () =>
      page.evaluate(
        () =>
          document.querySelector(
            '[data-state-list="open"] [data-bench-item]',
          ) !== null &&
          document.querySelector(
            '[data-state-list="closed"] [data-bench-item]',
          ) !== null,
      ),
    'both state lists rendered',
    5000,
  );

  // Issue #1 has state 'open' in fixture data (number 1 => index 0, i%3!==0 => open)
  const inOpen = await page.evaluate(
    () =>
      document.querySelector(
        '[data-state-list="open"] [data-issue-number="1"]',
      ) !== null,
  );
  assert(inOpen, lib, 'moveItem setup', 'issue #1 not in open list');

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.moveItem!(1));
  await waitForComplete(page);

  await waitFor(
    page,
    async () =>
      page.evaluate(
        () =>
          document.querySelector(
            '[data-state-list="closed"] [data-issue-number="1"]',
          ) !== null,
      ),
    'issue #1 in closed list after move',
    5000,
  );

  const inOpenAfter = await page.evaluate(
    () =>
      document.querySelector(
        '[data-state-list="open"] [data-issue-number="1"]',
      ) !== null,
  );
  assert(
    !inOpenAfter,
    lib,
    'moveItem removed from source',
    'issue #1 still in open list after move',
  );
});

// ── listDetailSwitch ─────────────────────────────────────────────────

test('listDetailSwitch completes with correct DOM transitions', async (page, lib) => {
  if (
    !(await page.evaluate(
      () => typeof window.__BENCH__?.listDetailSwitch === 'function',
    ))
  )
    return;

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.listDetailSwitch!(20));
  await waitForComplete(page, 30000);

  const hasSortedList = await page.evaluate(
    () => document.querySelector('[data-sorted-list]') !== null,
  );
  assert(
    hasSortedList,
    lib,
    'listDetailSwitch sorted-list',
    'sorted list not in DOM after listDetailSwitch completed',
  );

  const hasDetail = await page.evaluate(
    () => document.querySelector('[data-detail-view]') !== null,
  );
  assert(
    !hasDetail,
    lib,
    'listDetailSwitch detail-gone',
    'detail view still in DOM after listDetailSwitch completed',
  );

  const hasMeasure = await page.evaluate(() =>
    performance
      .getEntriesByType('measure')
      .some(m => m.name === 'mount-duration'),
  );
  assert(
    hasMeasure,
    lib,
    'listDetailSwitch measure',
    'no mount-duration performance measure recorded',
  );
});

// ── TIMING VALIDATION ────────────────────────────────────────────────
// Verify that when data-bench-complete fires (measurement ends), the DOM
// already reflects the update. A 100ms network delay makes timing bugs
// observable: if the measureUpdate callback doesn't return its promise
// chain, finish() fires via the sync-path double-rAF (~32ms) before the
// async fetch resolves. data-client passes because controller.fetch()
// dispatches optimistic updates to the store synchronously.

test('updateEntity timing: DOM reflects change at measurement end', async (page, lib) => {
  await initAndWaitForIssues(page);
  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(100));

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.updateEntity(1));
  await waitForComplete(page);

  const titles = await getIssueTitles(page);
  assert(
    titles[1]?.includes('(updated)') ?? false,
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

  await initAndWaitForIssues(page, 10);
  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(100));

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.unshiftItem!());
  await waitForComplete(page);

  const titles = await getIssueTitles(page);
  assert(
    Object.values(titles).some(t => t === 'New Issue'),
    lib,
    'unshiftItem timing',
    `"New Issue" not in DOM when data-bench-complete fired. ` +
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

  await initAndWaitForIssues(page, 10);
  await page.evaluate(() => window.__BENCH__!.setNetworkDelay(100));

  await clearComplete(page);
  await page.evaluate(() => window.__BENCH__!.deleteEntity!(1));
  await waitForComplete(page);

  const titles = await getIssueTitles(page);
  assert(
    !(1 in titles),
    lib,
    'deleteEntity timing',
    `issue #1 still in DOM when data-bench-complete fired. ` +
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
