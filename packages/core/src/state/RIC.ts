const RIC: (cb: (...args: any[]) => void, options: any) => void = (
  typeof requestIdleCallback === 'function' ? requestIdleCallback : (
    (cb: any) => cb()
  )) as any;
export default RIC;
