// With the React DevTools hook present, React's profiling build profiles the
// whole tree and tracks updaters on every update, slowing every page for
// visitors with the extension installed. Pin it off so only <Profiler>
// subtrees are timed. DevTools still connects (injection checks the hook
// separately); its Profiler tab just records like production.
// (`supportsUserTiming` stays on: its per-commit `console.timeStamp` calls are
// no-ops unless a profile is recording, and pinning it off lets terser drop a
// `var` that is still used.)
const DEVTOOLS_CHECK =
  'isDevToolsPresent = "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__';

module.exports = function (source) {
  const patched = source.replace(DEVTOOLS_CHECK, 'isDevToolsPresent = false');
  if (patched === source) {
    throw new Error(
      'profiling-loader: react-dom profiling build changed; update DEVTOOLS_CHECK',
    );
  }
  return patched;
};
