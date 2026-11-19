// Summarize a Chromium trace (Playwright browser.startTracing) into JS cost on the page's main thread.

export const TRACE_CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'v8',
  'v8.execute',
  'disabled-by-default-v8.compile',
  'loading',
];

const PARSE_COMPILE = /^(V8\.(Parse|PreParse|Compile)|v8\.compile)/;
const EVALUATE = /^(v8\.evaluateModule|EvaluateScript)$/;
const ALL_SCRIPT =
  /^(v8\.evaluateModule|EvaluateScript|FunctionCall|v8\.callFunction|RunMicrotasks|TimerFire|EventDispatch)$/;

// Total length of the union of [start, end) intervals, so nested events count once.
function unionMs(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [cs, ce] = [-Infinity, -Infinity];
  for (const [s, e] of intervals) {
    if (s > ce) {
      if (ce > cs) total += ce - cs;
      [cs, ce] = [s, e];
    } else if (e > ce) ce = e;
  }
  if (ce > cs) total += ce - cs;
  return total / 1000;
}

/** @returns {{parseCompileMs:number, evaluateMs:number, scriptMs:number}} */
export function summarizeTrace(buffer) {
  const json = JSON.parse(buffer.toString());
  const events = json.traceEvents ?? json;
  const main = new Set(
    events
      .filter(
        e => e.name === 'thread_name' && e.args?.name === 'CrRendererMain',
      )
      .map(e => `${e.pid}:${e.tid}`),
  );
  const buckets = { parseCompile: [], evaluate: [], script: [] };
  for (const e of events) {
    if (e.ph !== 'X' || !main.has(`${e.pid}:${e.tid}`)) continue;
    const iv = [e.ts, e.ts + (e.dur ?? 0)];
    if (PARSE_COMPILE.test(e.name)) buckets.parseCompile.push(iv);
    if (EVALUATE.test(e.name)) buckets.evaluate.push(iv);
    if (ALL_SCRIPT.test(e.name)) buckets.script.push(iv);
  }
  return {
    parseCompileMs: unionMs(buckets.parseCompile),
    evaluateMs: unionMs(buckets.evaluate),
    scriptMs: unionMs(buckets.script),
  };
}
