// Injected into every page before app code runs (page.addInitScript).
// Records, on the page clock (performance.now()):
// - long tasks (main-thread blocks > 50ms)
// - event timing (input -> next paint latency for clicks and key presses)
// - layout shifts
// - intervals where any element matching window.__IMPACT_LOADING__ is visible
(() => {
  const rec = (window.__impact = {
    origin: performance.timeOrigin,
    longtasks: [],
    events: [],
    shifts: [],
    loading: [],
  });
  const observe = (type, fn, opts = {}) => {
    try {
      new PerformanceObserver(list => list.getEntries().forEach(fn)).observe({
        type,
        buffered: true,
        ...opts,
      });
    } catch {}
  };
  observe('longtask', e =>
    rec.longtasks.push({ start: e.startTime, dur: e.duration }),
  );
  observe(
    'event',
    e => {
      if (!e.interactionId) return;
      rec.events.push({ start: e.startTime, dur: e.duration, type: e.name });
    },
    { durationThreshold: 16 },
  );
  rec.lcp = [];
  observe('largest-contentful-paint', e => rec.lcp.push(e.startTime));
  observe('layout-shift', e => {
    if (!e.hadRecentInput)
      rec.shifts.push({ start: e.startTime, value: e.value });
  });

  // Loading indicators: poll on every animation frame, cheap enough for a test run.
  let since = null;
  const visible = el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const tick = () => {
    const sel = window.__IMPACT_LOADING__;
    let on = false;
    if (sel) {
      for (const el of document.querySelectorAll(sel)) {
        if (visible(el)) {
          on = true;
          break;
        }
      }
    }
    const now = performance.now();
    if (on && since === null) since = now;
    if (!on && since !== null) {
      rec.loading.push({ start: since, end: now });
      since = null;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  rec.flush = () => {
    const out = rec.loading.slice();
    if (since !== null) out.push({ start: since, end: performance.now() });
    return out;
  };
})();
