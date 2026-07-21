import {
  computeMaxInputDelayMs,
  excessMissedFramesFromIntervals,
  frameIntervalsFromTimestamps,
  median,
  missedFramesFromTimestamps,
} from '../src/frames';
import {
  splitMixedCount,
  scenarioId,
  parseScenarioId,
  listScenarios,
} from '../src/scenario';

describe('scenarioId', () => {
  it('builds stable android interaction ids', () => {
    expect(
      scenarioId({
        candidateKind: 'entity',
        pattern: 'unique',
        count: 1000,
        control: 'gc',
      }),
    ).toBe('android/entity/unique/1000/interaction/gc');
  });

  it('round-trips parseScenarioId', () => {
    const id = 'android/mixed/unique/10000/interaction/no-gc';
    expect(scenarioId(parseScenarioId(id))).toBe(id);
  });

  it('lists duplicate only for entity', () => {
    const ids = listScenarios().map(scenarioId);
    expect(ids.some(id => id.includes('/duplicate/'))).toBe(true);
    expect(ids.some(id => id.startsWith('android/endpoint/duplicate'))).toBe(
      false,
    );
  });
});

describe('splitMixedCount', () => {
  it('splits evenly with remainder to entities', () => {
    expect(splitMixedCount(1000)).toEqual({ entities: 500, endpoints: 500 });
    expect(splitMixedCount(1001)).toEqual({ entities: 501, endpoints: 500 });
  });
});

describe('excessMissedFramesFromIntervals', () => {
  it('counts nearest-period excess stalls', () => {
    expect(excessMissedFramesFromIntervals([16.6], 16.6)).toBe(0);
    expect(excessMissedFramesFromIntervals([33.2], 16.6)).toBe(1);
    // slightly under 2× still rounds to 2 periods → 1 missed
    expect(excessMissedFramesFromIntervals([1.98 * 16.6], 16.6)).toBe(1);
  });

  it('returns 0 for non-positive period', () => {
    expect(excessMissedFramesFromIntervals([50], 0)).toBe(0);
  });
});

describe('missedFramesFromTimestamps', () => {
  it('detects a multi-period stall in a pre→collect→post rAF sequence', () => {
    const period = 16.67;
    // pre @0, collect @period, then post only after ~3 periods (2 missed)
    // This is what queueing the next rAF *before* blocking sweep enables.
    const timestamps = [
      0,
      period,
      period + 3 * period, // collect→post gap spans 3 periods
      period + 3 * period + period,
    ];
    expect(frameIntervalsFromTimestamps(timestamps)).toEqual([
      period,
      3 * period,
      period,
    ]);
    expect(missedFramesFromTimestamps(timestamps, period)).toBe(2);
  });

  it('reports 0 missed when every interval is one display period', () => {
    const period = 16.67;
    const timestamps = [0, period, 2 * period, 3 * period];
    expect(missedFramesFromTimestamps(timestamps, period)).toBe(0);
  });
});

describe('computeMaxInputDelayMs', () => {
  it('is max of timer delay and frame excess (not pointer latency)', () => {
    expect(computeMaxInputDelayMs(5, [16.6, 40], 16.6)).toBe(
      Math.max(5, 40 - 16.6),
    );
  });
});

describe('median', () => {
  it('handles even and odd lengths', () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});
