import { readJsHeapBytes } from '../src/BenchNative';

describe('readJsHeapBytes', () => {
  const g = globalThis as typeof globalThis & {
    performance?: BenchPerformance;
  };
  const original = g.performance;

  afterEach(() => {
    Object.defineProperty(g, 'performance', {
      value: original,
      configurable: true,
      writable: true,
    });
  });

  it('returns undefined when performance is absent', () => {
    Object.defineProperty(g, 'performance', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(readJsHeapBytes()).toBeUndefined();
  });

  it('returns undefined when memory is absent', () => {
    Object.defineProperty(g, 'performance', {
      value: { now: () => 0 },
      configurable: true,
      writable: true,
    });
    expect(readJsHeapBytes()).toBeUndefined();
  });

  it('returns usedJSHeapSize when exposed', () => {
    Object.defineProperty(g, 'performance', {
      value: { now: () => 0, memory: { usedJSHeapSize: 12345 } },
      configurable: true,
      writable: true,
    });
    expect(readJsHeapBytes()).toBe(12345);
  });
});
