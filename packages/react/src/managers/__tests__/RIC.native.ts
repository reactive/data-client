import { IdlingNetworkManager } from '..';
describe('RequestIdleCallback', () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should run using InteractionManager', async () => {
    const fn = jest.fn();
    jest.useFakeTimers();
    // @ts-expect-error this is protected member
    new IdlingNetworkManager().idleCallback(fn, {});
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();
    jest.useRealTimers();
  });
  it('should run with timeout using InteractionManager', async () => {
    const fn = jest.fn();
    jest.useFakeTimers();
    // @ts-expect-error this is protected member
    new IdlingNetworkManager().idleCallback(fn, { timeout: 500 });
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
