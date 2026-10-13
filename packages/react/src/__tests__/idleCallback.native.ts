describe('idleCallback (native)', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('uses InteractionManager when React Native still provides it', () => {
    const cancel = jest.fn();
    const InteractionManager = {
      runAfterInteractions: jest.fn(() => ({ cancel })),
      setDeadline: jest.fn(),
    };
    jest.doMock('react-native', () => ({ InteractionManager }));
    const fn = jest.fn();
    const idleCallback: typeof import('../idleCallback.native').default =
      require('../idleCallback.native').default;

    const stop = idleCallback(fn, { timeout: 500 });
    expect(InteractionManager.runAfterInteractions).toHaveBeenCalledWith(fn);
    expect(InteractionManager.setDeadline).toHaveBeenCalledWith(500);
    stop();
    expect(cancel).toHaveBeenCalled();
  });

  it('falls back to requestIdleCallback when accessing InteractionManager throws', () => {
    jest.doMock('react-native', () => ({
      get InteractionManager() {
        throw new Error('InteractionManager has been removed');
      },
    }));
    const fn = jest.fn();
    const idleCallback: typeof import('../idleCallback.native').default =
      require('../idleCallback.native').default;

    jest.useFakeTimers();
    idleCallback(fn);
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();

    const cancelled = jest.fn();
    idleCallback(cancelled)();
    jest.runAllTimers();
    expect(cancelled).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
