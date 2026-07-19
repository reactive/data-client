/**
 * Timed collect sequence inside rAF callbacks with fail-closed termination.
 *
 * If collect work (e.g. policy.sweep) throws, the Promise rejects once and any
 * already-queued frame callbacks no-op so the outer finally can tear down
 * animation / native capture.
 */

export type FrameScheduler = (cb: (nowMs: number) => void) => void;

export interface CollectWorkResult {
  totalMs: number;
  actionCount: number;
}

export interface RafCollectSequenceResult {
  frameTimestamps: number[];
  timerDelayMs: number;
  totalMs: number;
  actionCount: number;
}

export interface RafCollectSequenceOptions {
  /** Schedule a frame callback (defaults to requestAnimationFrame). */
  scheduleFrame?: FrameScheduler;
  /** performance.now (or test double). */
  now?: () => number;
  /** setTimeout(0) probe (or test double). */
  scheduleTimeout0?: (cb: () => void) => void;
  postFrames?: number;
  /**
   * Synchronous collect work invoked inside the collect frame *after* the next
   * rAF is queued. May throw — that rejects the sequence promptly.
   */
  collectWork: () => CollectWorkResult;
  /** Invoked exactly once when the sequence terminates due to error. */
  onTerminateError?: (error: unknown) => void;
}

/**
 * Manual scheduler for deterministic tests: callbacks are queued and flushed
 * with synthetic timestamps.
 */
export function createManualFrameScheduler(periodMs = 16.67): {
  scheduleFrame: FrameScheduler;
  flush: (count?: number) => void;
  pending: () => number;
} {
  const queue: Array<(nowMs: number) => void> = [];
  let nowMs = 0;
  return {
    scheduleFrame(cb) {
      queue.push(cb);
    },
    flush(count = 1) {
      for (let i = 0; i < count; i++) {
        const cb = queue.shift();
        if (!cb) return;
        nowMs += periodMs;
        cb(nowMs);
      }
    },
    pending() {
      return queue.length;
    },
  };
}

function defaultScheduleFrame(cb: (nowMs: number) => void) {
  requestAnimationFrame(cb);
}

function defaultTimeout0(cb: () => void) {
  setTimeout(cb, 0);
}

/**
 * Run pre → collect → post rAF sequence. Queues the post frame *before*
 * collectWork so stalls are visible; wraps work in try/catch with reject-once.
 */
export function runRafCollectSequence(
  options: RafCollectSequenceOptions,
): Promise<RafCollectSequenceResult> {
  const scheduleFrame = options.scheduleFrame ?? defaultScheduleFrame;
  const now = options.now ?? (() => performance.now());
  const scheduleTimeout0 = options.scheduleTimeout0 ?? defaultTimeout0;
  const POST_FRAMES = options.postFrames ?? 6;

  return new Promise<RafCollectSequenceResult>((resolve, reject) => {
    /** Once true, no callback may mutate probe state or settle again. */
    let closed = false;
    let phase: 'pre' | 'collect' | 'post' = 'pre';
    let postRemaining = POST_FRAMES;
    const frameTimestamps: number[] = [];
    let timerDelayMs = 0;
    let totalMs = 0;
    let actionCount = 0;

    const settleReject = (error: unknown) => {
      if (closed) return;
      closed = true;
      try {
        options.onTerminateError?.(error);
      } catch {
        // ignore cleanup listener failures
      }
      reject(error);
    };

    const settleResolve = () => {
      if (closed) return;
      closed = true;
      resolve({
        frameTimestamps,
        timerDelayMs,
        totalMs,
        actionCount,
      });
    };

    const frame = (frameNow: number) => {
      if (closed) return;

      try {
        frameTimestamps.push(frameNow);

        if (phase === 'pre') {
          phase = 'collect';
          scheduleFrame(frame);
          return;
        }

        if (phase === 'collect') {
          // Queue next rAF BEFORE collect work so a stall is observable.
          phase = 'post';
          postRemaining = POST_FRAMES;
          scheduleFrame(frame);

          const beforeCollection = now();
          scheduleTimeout0(() => {
            if (closed) return;
            timerDelayMs = now() - beforeCollection;
          });

          const result = options.collectWork();
          totalMs = result.totalMs;
          actionCount = result.actionCount;
          return;
        }

        // post
        postRemaining--;
        if (postRemaining > 0) {
          scheduleFrame(frame);
          return;
        }

        scheduleTimeout0(() => {
          if (closed) return;
          settleResolve();
        });
      } catch (error) {
        settleReject(error);
      }
    };

    scheduleFrame(frame);
  });
}
