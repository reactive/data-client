import runWhenIdle from '../runWhenIdle.native';

describe('runWhenIdle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    delete (global as any).requestIdleCallback;
    delete (global as any).cancelIdleCallback;
    jest.useRealTimers();
  });

  describe('with requestIdleCallback', () => {
    beforeEach(() => {
      (global as any).requestIdleCallback = jest.fn((cb: () => void) =>
        setTimeout(cb, 0),
      );
      (global as any).cancelIdleCallback = jest.fn(clearTimeout);
    });

    it('should defer callback until idle', () => {
      const fn = jest.fn();
      runWhenIdle(fn);
      expect((global as any).requestIdleCallback).toHaveBeenCalledWith(fn);
      expect(fn).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel with cancelIdleCallback', () => {
      const fn = jest.fn();
      const cancel = runWhenIdle(fn);
      cancel();
      expect((global as any).cancelIdleCallback).toHaveBeenCalled();
      jest.runAllTimers();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('without requestIdleCallback', () => {
    it('should defer callback to a timeout', () => {
      const fn = jest.fn();
      runWhenIdle(fn);
      expect(fn).not.toHaveBeenCalled();
      jest.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending timeout', () => {
      const fn = jest.fn();
      const cancel = runWhenIdle(fn);
      cancel();
      jest.runAllTimers();
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
