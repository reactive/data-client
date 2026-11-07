#!/usr/bin/env node
// Runs one scripted user flow against the baseline and migrated builds, interleaved, and
// compares what the user experiences: requests, redundant fetches, loading states, stale views,
// mutation-to-UI time, main-thread blocking and cold-load JS cost.
//
//   node flow.mjs --config <app>/flow.config.mjs --baseline <url> --migrated <url> \
//     [--runs 10] [--cpu 4] [--out flow.json] [--headed]
//
// Playwright is resolved from the current folder (run from the app) or this folder.
// Set CHROMIUM_PATH to use a specific browser binary.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { sampled } from './utils/metrics.mjs';
import { loadConfig } from './utils/config.mjs';
import { compare } from './utils/stats.mjs';
import { summarizeTrace, TRACE_CATEGORIES } from './utils/trace.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { values: opt } = parseArgs({
  options: {
    config: { type: 'string' },
    baseline: { type: 'string' },
    migrated: { type: 'string' },
    runs: { type: 'string', default: '10' },
    cpu: { type: 'string', default: '4' },
    out: { type: 'string', default: 'flow.json' },
    headed: { type: 'boolean', default: false },
    'skip-landing': { type: 'boolean', default: false },
    // Recompute summary and metrics from an earlier flow.json's samples without running anything.
    from: { type: 'string' },
  },
});
if (!opt.config || (!opt.from && (!opt.baseline || !opt.migrated))) {
  console.error(
    'usage: flow.mjs --config <flow.config.mjs> --baseline <url> --migrated <url> [--runs N] [--cpu N] [--out file]',
  );
  process.exit(2);
}

const require = createRequire(join(process.cwd(), 'noop.js'));
const pwPath = (() => {
  try {
    return require.resolve('playwright');
  } catch {
    return createRequire(import.meta.url).resolve('playwright');
  }
})();
const pw = await import(pathToFileURL(pwPath).href);
const { chromium } = pw.default ?? pw;
const config = await loadConfig(resolve(opt.config), 'flow');
const probe = readFileSync(join(here, 'utils/probe.js'), 'utf8');
const previous = opt.from ? JSON.parse(readFileSync(opt.from, 'utf8')) : null;
const runs = previous?.runs ?? +opt.runs;
const cpu = previous?.cpuThrottle ?? +opt.cpu;
const variants = {
  baseline: opt.baseline?.replace(/\/$/, ''),
  migrated: opt.migrated?.replace(/\/$/, ''),
};

// lowerIsBetter=false for metrics where more is better.
const HIGHER_IS_BETTER = new Set(['navsWithoutLoading']);

// samples[section][name][metric][variant] = number[]
const samples = previous?.samples ?? { landing: {}, steps: {}, totals: {} };
const failures = previous?.failures ?? { baseline: [], migrated: [] };
// A run's samples are staged and kept only if the whole run succeeds, so every row uses the same runs.
let staged = [];
const stage = (...entry) => staged.push(entry);
const commit = (section, name, metrics, variant) => {
  const s = (samples[section][name] ??= {});
  for (const [k, v] of Object.entries(metrics)) {
    if (v === undefined || v === null) continue;
    (s[k] ??= { baseline: [], migrated: [] })[variant].push(v);
  }
};

const browser =
  previous ? null : (
    await chromium.launch({
      headless: !opt.headed,
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox'],
    })
  );

async function newPage() {
  const ctx = await browser.newContext(config.context ?? {});
  await ctx.addInitScript(
    `window.__IMPACT_LOADING__ = ${JSON.stringify(config.loading ?? '')};\n${probe}`,
  );
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  return { ctx, page, cdp };
}

async function landing(base) {
  const { ctx, page, cdp } = await newPage();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await cdp.send('Performance.enable');
  let tracing = false;
  let loadMs, readyMs, trace, m, rec;
  try {
    await browser.startTracing(page, { categories: TRACE_CATEGORIES });
    tracing = true;
    const t0 = Date.now();
    await page.goto(base + (config.landing?.path ?? '/'), {
      waitUntil: 'load',
    });
    loadMs = Date.now() - t0;
    if (config.landing?.ready) await config.landing.ready({ page });
    readyMs = Date.now() - t0;
    const buffer = await browser.stopTracing();
    tracing = false;
    trace = summarizeTrace(buffer);
    m = Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map(x => [
        x.name,
        x.value,
      ]),
    );
    rec = await page.evaluate(() => ({
      lcp: window.__impact.lcp.at(-1),
      longtasks: window.__impact.longtasks,
      loading: window.__impact.flush(),
    }));
  } finally {
    // A failed run must not leave tracing on, or every later startTracing fails.
    if (tracing) await browser.stopTracing().catch(() => {});
    await ctx.close().catch(() => {});
  }
  return {
    loadMs,
    readyMs,
    lcpMs: rec.lcp,
    parseCompileMs: trace.parseCompileMs,
    evaluateMs: trace.evaluateMs,
    scriptMs: trace.scriptMs,
    tbtMs: rec.longtasks.reduce((t, l) => t + Math.max(0, l.dur - 50), 0),
    heapMb: m.JSHeapUsedSize / 1e6,
    loadingMs: rec.loading.reduce((t, l) => t + l.end - l.start, 0),
  };
}

/** Tracks data requests so a step can wait for the network to go quiet. */
function trackNetwork(page) {
  const isData = config.isData ?? (() => true);
  const net = {
    log: [],
    inflight: 0,
    lastActivity: Date.now(),
    bodies: [],
    seen: new Map(),
  };
  page.on('request', r => {
    if (!isData(r.url(), r)) return;
    net.inflight++;
    net.lastActivity = Date.now();
    net.log.push({ method: r.method(), url: r.url(), redundant: false });
  });
  const done = r => {
    if (!isData(r.url(), r)) return;
    net.inflight = Math.max(0, net.inflight - 1);
    net.lastActivity = Date.now();
  };
  page.on('requestfinished', done);
  page.on('requestfailed', done);
  page.on('response', res => {
    const req = res.request();
    if (req.method() !== 'GET' || !isData(req.url(), req)) return;
    const entry = net.log.findLast(
      e => e.url === req.url() && e.method === 'GET',
    );
    net.bodies.push(
      res
        .body()
        .then(b => {
          const hash = createHash('sha1').update(b).digest('hex');
          // The client already received this exact payload from this URL in this session.
          if (net.seen.get(req.url()) === hash && entry) entry.redundant = true;
          net.seen.set(req.url(), hash);
        })
        .catch(() => {
          // Counted so a zero redundant-read count is never silently a broken detector.
          if (entry) entry.unhashed = true;
        }),
    );
  });
  net.settle = async (quietMs = config.quietMs ?? 500, maxMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (net.inflight === 0 && Date.now() - net.lastActivity >= quietMs) break;
      await new Promise(r => setTimeout(r, 50));
    }
    await Promise.all(net.bodies);
  };
  return net;
}

async function pollFresh(step, ctx, timeoutMs) {
  const start = Date.now();
  while (true) {
    if (await step.fresh(ctx).catch(() => false)) return Date.now() - start;
    if (Date.now() - start > timeoutMs) return null;
    await new Promise(r => setTimeout(r, 50));
  }
}

async function flow(base, variant) {
  const { ctx: bctx, page, cdp } = await newPage();
  const net = trackNetwork(page);
  const ctx = {
    page,
    base,
    uid: Math.random().toString(36).slice(2, 8),
    state: {},
  };
  const totals = {
    flowMs: 0,
    requests: 0,
    reads: 0,
    writes: 0,
    redundant: 0,
    loadingShown: 0,
    loadingMs: 0,
    longTasks: 0,
    tbtMs: 0,
    staleViews: 0,
    navsWithoutLoading: 0,
    mutationFollowupReads: 0,
    mutationReflectMs: 0,
    unhashedReads: 0,
    maxInteractionMs: 0,
    cls: 0,
  };
  try {
    if (config.setup) await config.setup(ctx);
    await net.settle();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    for (const step of config.steps) {
      // Unmeasured: open forms, type input, dismiss toasts.
      if (step.prepare) await step.prepare(ctx);
      const before = net.log.length;
      const [origin0, p0] = await page.evaluate(() => [
        window.__impact.origin,
        performance.now(),
      ]);
      const t0 = Date.now();
      await step.run(ctx);
      if (step.ready) await step.ready(ctx);
      const readyMs = Date.now() - t0;
      let freshMs;
      if (step.fresh)
        freshMs = await pollFresh(step, ctx, config.staleTimeoutMs ?? 3000);
      await net.settle();
      const rec = await page.evaluate(() => ({
        origin: window.__impact.origin,
        longtasks: window.__impact.longtasks,
        events: window.__impact.events,
        shifts: window.__impact.shifts,
        loading: window.__impact.flush(),
      }));
      // A full page load inside the step resets the page clock; then count from its start.
      const from = rec.origin === origin0 ? p0 : 0;
      const inWin = e => e.start >= from;
      const loading = rec.loading.filter(l => l.end > from);
      const longtasks = rec.longtasks.filter(inWin);
      const reqs = net.log.slice(before);
      const m = {
        readyMs,
        requests: reqs.length,
        reads: reqs.filter(r => r.method === 'GET').length,
        writes: reqs.filter(r => r.method !== 'GET').length,
        redundant: reqs.filter(r => r.redundant).length,
        unhashedReads: reqs.filter(r => r.unhashed).length,
        loadingShown: loading.length,
        loadingMs: loading.reduce(
          (t, l) => t + (l.end - Math.max(l.start, from)),
          0,
        ),
        longTasks: longtasks.length,
        tbtMs: longtasks.reduce((t, l) => t + Math.max(0, l.dur - 50), 0),
        maxInteractionMs: Math.max(
          0,
          ...rec.events.filter(inWin).map(e => e.dur),
        ),
        cls: rec.shifts.filter(inWin).reduce((t, s) => t + s.value, 0),
      };
      if (step.fresh) {
        m.stale = freshMs === null ? 1 : 0;
        if (freshMs !== null) m.freshMs = freshMs;
      }
      stage('steps', step.name, m, variant);
      for (const k of [
        'requests',
        'reads',
        'writes',
        'redundant',
        'unhashedReads',
        'loadingShown',
        'loadingMs',
        'longTasks',
        'tbtMs',
      ])
        totals[k] += m[k];
      totals.flowMs += readyMs;
      totals.maxInteractionMs = Math.max(
        totals.maxInteractionMs,
        m.maxInteractionMs,
      );
      totals.cls += m.cls;
      totals.staleViews += m.stale ?? 0;
      if (step.kind === 'mutation') {
        totals.mutationFollowupReads += m.reads;
        totals.mutationReflectMs += readyMs;
      }
      if ((step.kind ?? 'nav') === 'nav' && m.loadingShown === 0)
        totals.navsWithoutLoading++;
    }
  } finally {
    await bctx.close().catch(() => {});
  }
  return totals;
}

const order = ['baseline', 'migrated'];
for (let i = 0; !previous && i < runs; i++) {
  // Alternate which variant goes first so drift (thermal, GC, cache) affects both equally.
  for (const variant of i % 2 ? [...order].reverse() : order) {
    const base = variants[variant];
    staged = [];
    try {
      if (!opt['skip-landing'])
        stage('landing', 'cold load', await landing(base), variant);
      stage('totals', 'flow', await flow(base, variant), variant);
      for (const entry of staged) commit(...entry);
      process.stderr.write(`run ${i + 1}/${runs} ${variant} ok\n`);
    } catch (e) {
      failures[variant].push(String(e?.message ?? e).split('\n')[0]);
      process.stderr.write(
        `run ${i + 1}/${runs} ${variant} FAILED: ${e?.message}\n`,
      );
    }
  }
}
await browser?.close();

const summarize = section =>
  Object.fromEntries(
    Object.entries(section).map(([name, metrics]) => [
      name,
      Object.fromEntries(
        Object.entries(metrics).map(([k, v]) => [
          k,
          compare(v.baseline, v.migrated, {
            lowerIsBetter: !HIGHER_IS_BETTER.has(k),
          }),
        ]),
      ),
    ]),
  );

const navs = config.steps.filter(s => (s.kind ?? 'nav') === 'nav').length;
const LABELS = {
  landing: {
    readyMs: ['First screen ready', 'ms'],
    loadMs: ['Load event', 'ms'],
    lcpMs: ['Largest contentful paint', 'ms'],
    parseCompileMs: ['JS parse + compile', 'ms'],
    evaluateMs: ['JS module evaluation', 'ms'],
    scriptMs: ['Main-thread JS', 'ms'],
    tbtMs: ['Total blocking time', 'ms'],
    loadingMs: ['Loading indicator visible', 'ms'],
    heapMb: ['JS heap', 'MB'],
  },
  totals: {
    mutationReflectMs: ['Mutation submit to UI updated (sum)', 'ms'],
    mutationFollowupReads: ['Reads triggered by mutations', 'requests'],
    staleViews: ['Stale views (checked views showing old data)', 'views'],
    flowMs: ['All steps, action to ready (sum)', 'ms'],
    requests: ['API requests', 'requests'],
    reads: ['API reads (GET)', 'requests'],
    writes: ['API writes', 'requests'],
    redundant: [
      'Redundant reads (same URL, same payload already received)',
      'requests',
    ],
    navsWithoutLoading: [
      `Navigations with no loading indicator (of ${navs})`,
      'navs',
    ],
    loadingShown: ['Loading indicators shown', 'count'],
    loadingMs: ['Loading indicator visible', 'ms'],
    longTasks: ['Long tasks (>50ms)', 'count'],
    maxInteractionMs: ['Slowest interaction (input to next paint)', 'ms'],
    cls: ['Layout shift (CLS sum)', 'score'],
    unhashedReads: ['Reads the redundancy check could not hash', 'requests'],
    tbtMs: ['Total blocking time', 'ms'],
  },
};
const STEP_METRICS = {
  mutation: {
    readyMs: ['submit to UI updated', 'ms'],
    reads: ['follow-up reads', 'requests'],
  },
  nav: { readyMs: ['action to ready', 'ms'], reads: ['reads', 'requests'] },
};
const metrics = [];
const row = (group, id, label, unit, section, name, key) => {
  const v = samples[section][name]?.[key];
  if (!v) return;
  const lowerIsBetter = !HIGHER_IS_BETTER.has(key);
  metrics.push(
    sampled(
      group,
      id,
      label,
      unit,
      compare(v.baseline, v.migrated, { lowerIsBetter }),
      { lowerIsBetter },
    ),
  );
};
for (const [section, name, group] of [
  ['totals', 'flow', 'flow'],
  ['landing', 'cold load', 'cold load'],
]) {
  for (const [key, [label, unit]] of Object.entries(LABELS[section]))
    row(group, key, label, unit, section, name, key);
}
for (const step of config.steps) {
  const kind = step.kind ?? 'nav';
  for (const [key, [label, unit]] of Object.entries(
    STEP_METRICS[kind] ?? STEP_METRICS.nav,
  ))
    row(
      `${kind} steps`,
      `${step.name}.${key}`,
      `${step.name}: ${label}`,
      unit,
      'steps',
      step.name,
      key,
    );
  if (step.fresh)
    row(
      'stale views',
      `${step.name}.stale`,
      `${step.name}: stale (1 = yes)`,
      'median of runs',
      'steps',
      step.name,
      'stale',
    );
}
const result = {
  kind: 'flow',
  app: config.name,
  date: new Date().toISOString(),
  runs,
  cpuThrottle: cpu,
  steps: config.steps.map(s => ({
    name: s.name,
    kind: s.kind ?? 'nav',
    fresh: !!s.fresh,
  })),
  navSteps: navs,
  failures,
  metrics,
  summary: {
    landing: summarize(samples.landing),
    totals: summarize(samples.totals),
    steps: summarize(samples.steps),
  },
  samples,
};
writeFileSync(opt.out, JSON.stringify(result, null, 1));
console.error(`wrote ${opt.out}`);
