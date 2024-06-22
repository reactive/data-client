import { NetworkManager } from '..';
describe('RequestIdleCallback', () => {
  it('should run using InteractionManager', async () => {
    const fn = jest.fn();
    jest.useFakeTimers();
    // @ts-expect-error this is protected member
    new NetworkManager().idleCallback(fn, {});
    jest.runAllTimers();
    expect(fn).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
