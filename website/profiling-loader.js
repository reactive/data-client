// React's profiling build turns on ProfileMode for the whole tree (and tracks
// updaters on every update) whenever the React DevTools hook exists, which
// would slow every page for visitors with the extension installed. Pin it off
// so only <Profiler> subtrees are timed. DevTools still connects (injection
// checks the hook separately); its Profiler tab just records like production.
const DEVTOOLS_CHECK =
  'isDevToolsPresent = "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__';

module.exports = function (source) {
  if (!source.includes(DEVTOOLS_CHECK)) {
    throw new Error(
      'profiling-loader: react-dom profiling build changed; update DEVTOOLS_CHECK',
    );
  }
  return source.replace(DEVTOOLS_CHECK, 'isDevToolsPresent = false');
};
