import { IdlingNetworkManager } from '..';
describe('RequestIdleCallback', () => {
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
