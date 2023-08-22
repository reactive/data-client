const RIC: (cb: (...args: any[]) => void, options: any) => void = (
  typeof requestIdleCallback === 'function'
    ? requestIdleCallback
    : (cb: any) => setTimeout(cb, 0)
) as any;
export default RIC;
