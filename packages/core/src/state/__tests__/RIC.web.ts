describe('RequestIdleCallback', () => {
  it('should still run when requestIdleCallback is not available', () => {
    const requestIdle = (global as any).requestIdleCallback;
    (global as any).requestIdleCallback = undefined;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RIC = require('../RIC').default;
    const fn = jest.fn();
    jest.useFakeTimers();
    RIC(fn, {});
    jest.runAllTimers();
    expect(fn).toBeCalled();
    (global as any).requestIdleCallback = requestIdle;
  });
});
