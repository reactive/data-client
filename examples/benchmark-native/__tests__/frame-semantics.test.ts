import {
  missedFramesFromDurationMs,
  missedFramesFromIntervalMs,
  validateUiFrameCapture,
} from '../src/frames';

const P = 16.67;

describe('missedFramesFromDurationMs (FrameMetrics)', () => {
  it('boundary table at .99x 1x 1.01x 2x 2.01x', () => {
    expect(missedFramesFromDurationMs(0.99 * P, P)).toBe(0);
    expect(missedFramesFromDurationMs(1.0 * P, P)).toBe(0);
    // just over one period → ceil → 2 periods → 1 miss
    expect(missedFramesFromDurationMs(1.01 * P, P)).toBe(1);
    expect(missedFramesFromDurationMs(2.0 * P, P)).toBe(1);
    expect(missedFramesFromDurationMs(2.01 * P, P)).toBe(2);
  });
});

describe('missedFramesFromIntervalMs (Choreographer / JS rAF)', () => {
  it('boundary table at .99x 1x 1.01x 2x 2.01x', () => {
    expect(missedFramesFromIntervalMs(0.99 * P, P)).toBe(0);
    expect(missedFramesFromIntervalMs(1.0 * P, P)).toBe(0);
    // 1.01× still rounds to 1 period → 0 miss
    expect(missedFramesFromIntervalMs(1.01 * P, P)).toBe(0);
    expect(missedFramesFromIntervalMs(2.0 * P, P)).toBe(1);
    // 2.01× rounds to 2 → 1 miss (nearest-period)
    expect(missedFramesFromIntervalMs(2.01 * P, P)).toBe(1);
  });
});

describe('validateUiFrameCapture', () => {
  const ok = {
    source: 'FrameMetrics' as const,
    frameCount: 3,
    maxFrameDurationMs: 20,
    totalFrameDurationMs: 50,
    missedFrames: 0,
    refreshPeriodMs: P,
    refreshRateHz: 60,
  };

  it('accepts a valid aggregate', () => {
    expect(() => validateUiFrameCapture(ok)).not.toThrow();
  });

  it('rejects invalid refresh period and zero frames', () => {
    expect(() => validateUiFrameCapture({ ...ok, refreshPeriodMs: 0 })).toThrow(
      /refreshPeriodMs/,
    );
    expect(() => validateUiFrameCapture({ ...ok, frameCount: 0 })).toThrow(
      /insufficient ui frames/,
    );
  });
});
