/**
 * Chromium-calibrated interaction probe for browser GC measurement.
 *
 * Ordering (Chromium-specific calibration — NOT a web platform guarantee):
 *   1. In an rAF callback, register the *next* rAF first (future frame pending).
 *   2. Then post setTimeout(0) so the collection/work task runs after paint.
 *   3. Synchronous work in that timer therefore blocks while a frame is pending,
 *      so wall-clock frame intervals can observe the stalled vsync gap.
 *
 * `totalMs` times only `work()` — scheduling overhead is excluded.
 * If `work()` throws, the probe rejects promptly, stops the rAF/timer chain,
 * and disconnects the PerformanceObserver (no further mutations).
 */
import {
  computeMaxInputDelayMs,
  excessMissedFrames,
  frameIntervalsFromTimestamps,
  longTaskOverlapsWindow,
} from './gcInteractionMetrics';

export interface InteractionProbeResult {
  totalMs: number;
  timerDelayMs: number;
  frameIntervalsMs: number[];
  displayPeriodMs: number;
  missedFrames: number;
  maxInputDelayMs: number;
  longTaskCount: number;
  longTaskTotalMs: number;
}

const POST_FRAMES = 6;

function drainAndDisconnectObserver(
  observer: PerformanceObserver | null,
  longTasks: { startTime: number; duration: number }[],
): void {
  if (!observer) return;
  try {
    for (const entry of observer.takeRecords()) {
      longTasks.push({
        startTime: entry.startTime,
        duration: entry.duration,
      });
    }
  } catch {
    // takeRecords unavailable
  }
  try {
    observer.disconnect();
  } catch {
    // ignore
  }
}

/**
 * Run one Chromium-calibrated probe. `work` is the only timed body.
 * Rejects if `work()` throws; settles exactly once.
 */
export async function runChromiumInteractionProbe(opts: {
  displayPeriodMs: number;
  work: () => void;
}): Promise<InteractionProbeResult> {
  const { displayPeriodMs, work } = opts;

  type LongTaskEntry = { startTime: number; duration: number };
  const longTasks: LongTaskEntry[] = [];
  let observer: PerformanceObserver | null = null;
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          longTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      });
      observer.observe({
        type: 'longtask',
        buffered: false,
      } as PerformanceObserverInit);
    } catch {
      observer = null;
    }
  }

  const frameTimestamps: number[] = [];
  let timerDelayMs = 0;
  let totalMs = 0;
  let windowStart = 0;
  let windowEnd = 0;

  try {
    await new Promise<void>((resolve, reject) => {
      let armed = false;
      let collectionDone = false;
      let postRemaining = POST_FRAMES;
      /** Once true, no callback may mutate probe state or schedule further work. */
      let closed = false;

      let rafHandle: number | null = null;
      let collectionTimer: ReturnType<typeof setTimeout> | null = null;
      let delayProbeTimer: ReturnType<typeof setTimeout> | null = null;
      let settleTimer: ReturnType<typeof setTimeout> | null = null;

      const clearPendingTimers = () => {
        if (rafHandle != null && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafHandle);
          rafHandle = null;
        }
        if (collectionTimer != null) {
          clearTimeout(collectionTimer);
          collectionTimer = null;
        }
        if (delayProbeTimer != null) {
          clearTimeout(delayProbeTimer);
          delayProbeTimer = null;
        }
        if (settleTimer != null) {
          clearTimeout(settleTimer);
          settleTimer = null;
        }
      };

      const settleOnce = (err?: unknown) => {
        if (closed) return;
        closed = true;
        clearPendingTimers();
        if (err !== undefined)
          reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      };

      const scheduleFrame = () => {
        if (closed) return;
        rafHandle = requestAnimationFrame(onFrame);
      };

      const onFrame = (rafNow: number) => {
        rafHandle = null;
        if (closed) return;

        frameTimestamps.push(rafNow);

        if (!armed) {
          armed = true;
          // 1) Future frame pending BEFORE collection is posted.
          scheduleFrame();
          // 2) Collection as macrotask — Chromium typically runs this post-paint.
          collectionTimer = setTimeout(() => {
            collectionTimer = null;
            if (closed) return;

            windowStart = performance.now();
            const beforeProbe = performance.now();
            // Responsiveness probe: delay from immediately before timed work.
            delayProbeTimer = setTimeout(() => {
              delayProbeTimer = null;
              if (closed) return;
              timerDelayMs = performance.now() - beforeProbe;
            }, 0);

            try {
              const t0 = performance.now();
              work();
              totalMs = performance.now() - t0;
              collectionDone = true;
            } catch (err) {
              settleOnce(err);
            }
          }, 0);
          return;
        }

        if (!collectionDone) {
          // Keep the chain alive until collection finishes (blocked frames).
          scheduleFrame();
          return;
        }

        postRemaining--;
        if (postRemaining > 0) {
          scheduleFrame();
          return;
        }

        windowEnd = performance.now();
        // Settle the responsiveness setTimeout(0) probe.
        settleTimer = setTimeout(() => {
          settleTimer = null;
          if (closed) return;
          settleOnce();
        }, 0);
      };

      scheduleFrame();
    });
  } finally {
    // Resolve and reject both land here — drain + disconnect observer.
    drainAndDisconnectObserver(observer, longTasks);
    observer = null;
  }

  const frameIntervalsMs = frameIntervalsFromTimestamps(frameTimestamps);
  const longTasksInWindow = longTasks.filter(t =>
    longTaskOverlapsWindow(t, windowStart, windowEnd),
  );

  return {
    totalMs,
    timerDelayMs,
    frameIntervalsMs,
    displayPeriodMs,
    missedFrames: excessMissedFrames(frameIntervalsMs, displayPeriodMs),
    maxInputDelayMs: computeMaxInputDelayMs(
      timerDelayMs,
      frameIntervalsMs,
      displayPeriodMs,
    ),
    longTaskCount: longTasksInWindow.length,
    longTaskTotalMs: longTasksInWindow.reduce((s, t) => s + t.duration, 0),
  };
}

/** Busy-wait for calibration only (not used in GC timing scenarios). */
export function syntheticBlockMs(ms: number): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // spin
  }
}

export const CALIBRATION_BLOCK_MS_MIN = 40;
export const CALIBRATION_BLOCK_MS_MAX = 50;
