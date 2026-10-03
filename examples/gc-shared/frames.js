'use strict';
/**
 * JS frame / responsiveness helpers shared by the browser and Android GC
 * harnesses (rAF + timers; not pointer latency). Missed-frame counting stays
 * platform-local because capture sources differ.
 * CommonJS on purpose (see ./README.md).
 */

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ?
      (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Adjacent differences of rAF timestamps (ms). */
function frameIntervalsFromTimestamps(timestamps) {
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  return intervals;
}

/**
 * Responsiveness proxy from timer + frame probes (not pointer input).
 * max(timerDelayMs, largest frame-interval excess over one display period).
 */
function computeMaxInputDelayMs(
  timerDelayMs,
  frameIntervalsMs,
  displayPeriodMs,
) {
  let maxExcessFrame = 0;
  if (displayPeriodMs > 0) {
    for (const interval of frameIntervalsMs) {
      maxExcessFrame = Math.max(
        maxExcessFrame,
        Math.max(0, interval - displayPeriodMs),
      );
    }
  }
  return Math.max(timerDelayMs, maxExcessFrame);
}

/** Quiet rAF intervals → display period (never hardcode 16.67). */
async function measureDisplayPeriodMs(samples = 8) {
  const intervals = [];
  await new Promise(resolve => {
    let last = 0;
    let n = 0;
    const frame = now => {
      if (n > 0) intervals.push(now - last);
      last = now;
      n++;
      if (n <= samples) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
  return median(intervals);
}

module.exports = {
  median,
  frameIntervalsFromTimestamps,
  computeMaxInputDelayMs,
  measureDisplayPeriodMs,
};
