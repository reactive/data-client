import {
  missedFramesFromDurationMs,
  missedFramesFromIntervalMs,
  validateUiFrameCapture,
  withFrameMetricsLoss,
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
    droppedFrameMetrics: 0,
    frameMetricsDropped: false,
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

describe('withFrameMetricsLoss', () => {
  const base = { missedFrames: 2, uiMissedFrames: 1 };

  it('flags a non-zero drop count without adding it to missed frames', () => {
    expect(withFrameMetricsLoss(base, 4)).toEqual({
      missedFrames: 2,
      uiMissedFrames: 1,
      uiDroppedFrameMetrics: 4,
      uiFrameMetricsDropped: true,
    });
  });

  it('leaves a clean capture unflagged', () => {
    expect(withFrameMetricsLoss(base, 0)).toEqual({
      missedFrames: 2,
      uiMissedFrames: 1,
      uiDroppedFrameMetrics: 0,
      uiFrameMetricsDropped: false,
    });
  });

  it('rejects a negative drop count', () => {
    expect(() => withFrameMetricsLoss(base, -1)).toThrow(/drop count/);
  });
});

describe('BenchNativeModule drop accounting', () => {
  const kt = require('fs').readFileSync(
    'android/app/src/main/java/com/dataclient/benchmarknative/BenchNativeModule.kt',
    'utf8',
  ) as string;

  function sliceBetween(start: string, end: string): string {
    const from = kt.indexOf(start);
    const to = kt.indexOf(end, from + start.length);
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    return kt.slice(from, to);
  }

  it('sums dropCountSinceLastInvocation and does not add it to missed frames', () => {
    expect(kt).toMatch(
      /OnFrameMetricsAvailableListener \{ _, frameMetrics, dropCountSinceLastInvocation ->/,
    );
    expect(kt).toMatch(
      /recordFrameMetricsDrop\(dropCountSinceLastInvocation\)/,
    );
    const dropFn = sliceBetween(
      'private fun recordFrameMetricsDrop',
      'private fun recordFrameMetricsDuration',
    );
    expect(dropFn).toMatch(/droppedFrameMetrics \+= dropCount/);
    expect(dropFn).not.toMatch(/missedFrames/);
    const durationFn = sliceBetween(
      'private fun recordFrameMetricsDuration',
      'private fun recordChoreographerInterval',
    );
    expect(durationFn).not.toMatch(/drop/);
    const intervalFn = sliceBetween(
      'private fun recordChoreographerInterval',
      'private fun resetCaptureCounters',
    );
    expect(intervalFn).not.toMatch(/drop/);
    expect(kt).toMatch(/putInt\("droppedFrameMetrics", droppedFrameMetrics\)/);
    expect(kt).toMatch(
      /putBoolean\("frameMetricsDropped", droppedFrameMetrics > 0\)/,
    );
  });
});
