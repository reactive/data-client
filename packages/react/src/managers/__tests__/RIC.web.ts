describe('RequestIdleCallback', () => {
  it('should still run when requestIdleCallback is not available', async () => {
    const requestIdle = (global as any).requestIdleCallback;
    (global as any).requestIdleCallback = undefined;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NetworkManager } = await import('..');
    const fn = jest.fn();
    jest.useFakeTimers();
    // @ts-expect-error
    new NetworkManager().idleCallback(fn, {});
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();
    (global as any).requestIdleCallback = requestIdle;
    jest.useRealTimers();
  });
});
