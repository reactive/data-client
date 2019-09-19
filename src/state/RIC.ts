const RIC: (cb: (...args: any[]) => void, options: any) => void =
  typeof (global as any).requestIdleCallback === 'function'
    ? (global as any).requestIdleCallback
    : cb => global.setTimeout(cb, 0);
export default RIC;
