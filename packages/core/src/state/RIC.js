const RIC =
  typeof requestIdleCallback === 'function'
    ? requestIdleCallback
    : cb => setTimeout(cb, 0);
export default RIC;
