describe('RequestIdleCallback', () => {
  it('should still run when requestIdleCallback is not available', async () => {
    const requestIdle = (global as any).requestIdleCallback;
    (global as any).requestIdleCallback = undefined;
    jest.resetModules();

    const { IdlingNetworkManager } = await import('..');
    const fn = jest.fn();
    jest.useFakeTimers();
    // @ts-expect-error
    new IdlingNetworkManager().idleCallback(fn, {});
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();
    (global as any).requestIdleCallback = requestIdle;
    jest.useRealTimers();
  });

  it('should run through requestIdleCallback', async () => {
    jest.resetModules();

    const { IdlingNetworkManager } = await import('..');
    const fn = jest.fn();
    jest.useFakeTimers();
    // @ts-expect-error
    new IdlingNetworkManager().idleCallback(fn, {});
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
