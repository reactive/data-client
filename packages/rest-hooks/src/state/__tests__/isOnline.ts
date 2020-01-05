import isOnline from '../isOnline';

describe('isOnline', () => {
  it('should be true when navigator is not set', () => {
    const oldValue = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: undefined,
      writable: true,
    });
    expect(isOnline()).toBe(true);
    Object.defineProperty(navigator, 'onLine', {
      value: oldValue,
      writable: false,
    });
  });
});
