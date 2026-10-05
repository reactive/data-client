describe('RequestIdleCallback', () => {
  afterEach(() => {
    delete (global as any).requestIdleCallback;
    jest.useRealTimers();
  });

  it('should still run when requestIdleCallback is not available', async () => {
    jest.resetModules();
    const { IdlingNetworkManager } = await import('..');
    const fn = jest.fn();
    // @ts-expect-error this is protected member
    new IdlingNetworkManager().idleCallback(fn, {});
    expect(fn).toHaveBeenCalled();
  });

  it('should run through requestIdleCallback with timeout', async () => {
    jest.useFakeTimers();
    (global as any).requestIdleCallback = jest.fn(
      (cb: () => void, options?: IdleRequestOptions) =>
        setTimeout(cb, options?.timeout ?? 0),
    );
    jest.resetModules();
    const { IdlingNetworkManager } = await import('..');
    const fn = jest.fn();
    // @ts-expect-error this is protected member
    new IdlingNetworkManager().idleCallback(fn, { timeout: 500 });
    expect(fn).not.toHaveBeenCalled();
    expect((global as any).requestIdleCallback).toHaveBeenCalledWith(fn, {
      timeout: 500,
    });
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();
  });
});
