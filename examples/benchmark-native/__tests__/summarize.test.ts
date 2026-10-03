import { summarizeGCSamples } from '../src/report';
import type { GCAndroidMeasurement } from '../src/types';

function baseSample(
  overrides: Partial<GCAndroidMeasurement> = {},
): GCAndroidMeasurement {
  return {
    schemaVersion: 1,
    totalMs: 10,
    sliceDurationsMs: [10],
    actionCount: 1,
    queueEntries: 1000,
    uniqueTargets: 1000,
    actionTargetCount: 1000,
    deletionCount: 1000,
    timerDelayMs: 1,
    frameIntervalsMs: [16],
    displayPeriodMs: 16,
    missedFrames: 0,
    maxInputDelayMs: 1,
    uiCaptureSource: 'FrameMetrics',
    uiFrameCount: 10,
    uiMaxFrameDurationMs: 16,
    uiTotalFrameDurationMs: 160,
    uiMissedFrames: 0,
    uiRefreshPeriodMs: 16.67,
    uiRefreshRateHz: 60,
    ...overrides,
  };
}

describe('summarizeGCSamples', () => {
  it('summarizes UI frame and memory delta fields when present', () => {
    const summary = summarizeGCSamples([
      baseSample({
        uiFrameCount: 10,
        uiMaxFrameDurationMs: 20,
        uiTotalFrameDurationMs: 160,
        uiMissedFrames: 1,
        processPssBeforeKb: 100,
        processPssAfterKb: 90,
        processPssDeltaKb: -10,
        processRssBeforeKb: 200,
        processRssAfterKb: 180,
        processRssDeltaKb: -20,
        jsHeapBeforeBytes: 1000,
        jsHeapAfterBytes: 800,
        jsHeapDeltaBytes: -200,
      }),
      baseSample({
        uiFrameCount: 12,
        uiMaxFrameDurationMs: 22,
        uiTotalFrameDurationMs: 180,
        uiMissedFrames: 0,
        processPssBeforeKb: 110,
        processPssAfterKb: 95,
        processPssDeltaKb: -15,
        processRssBeforeKb: 210,
        processRssAfterKb: 185,
        processRssDeltaKb: -25,
        jsHeapBeforeBytes: 1100,
        jsHeapAfterBytes: 850,
        jsHeapDeltaBytes: -250,
      }),
    ]);

    expect(summary.uiFrameCount?.median).toBe(11);
    expect(summary.uiTotalFrameDurationMs?.min).toBe(160);
    expect(summary.uiMaxFrameDurationMs?.max).toBe(22);
    expect(summary.uiMissedFrames?.median).toBe(0.5);
    expect(summary.processPssBeforeKb?.median).toBe(105);
    expect(summary.processPssAfterKb?.median).toBe(92.5);
    expect(summary.processPssDeltaKb?.median).toBe(-12.5);
    expect(summary.processRssDeltaKb?.median).toBe(-22.5);
    expect(summary.jsHeapDeltaBytes?.median).toBe(-225);
  });

  it('omits optional memory summaries when unavailable', () => {
    const summary = summarizeGCSamples([baseSample()]);
    expect(summary.processPssDeltaKb).toBeUndefined();
    expect(summary.processRssBeforeKb).toBeUndefined();
    expect(summary.jsHeapBeforeBytes).toBeUndefined();
    // UI aggregates are required on every sample
    expect(summary.uiFrameCount?.median).toBe(10);
  });
});
