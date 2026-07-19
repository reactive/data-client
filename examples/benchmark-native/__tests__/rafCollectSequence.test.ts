import {
  createManualFrameScheduler,
  runRafCollectSequence,
} from '../src/rafCollectSequence';

describe('runRafCollectSequence failure handling', () => {
  it('rejects promptly when collectWork throws and no-ops queued frames', async () => {
    const scheduler = createManualFrameScheduler(16.67);
    let terminateCalls = 0;
    let collectCalls = 0;
    const nowMs = 0;

    const pending = runRafCollectSequence({
      scheduleFrame: scheduler.scheduleFrame,
      now: () => nowMs,
      scheduleTimeout0: cb => {
        // Run macrotask probe synchronously for determinism.
        cb();
      },
      postFrames: 2,
      collectWork: () => {
        collectCalls++;
        throw new Error('sweep failed');
      },
      onTerminateError: () => {
        terminateCalls++;
      },
    });

    // pre → collect (queues post, then throws)
    scheduler.flush(1); // pre
    expect(scheduler.pending()).toBe(1);
    scheduler.flush(1); // collect — throws after queueing post

    // Promise rejects promptly so outer `finally` can stop animation/native capture.
    await expect(pending).rejects.toThrow('sweep failed');
    expect(collectCalls).toBe(1);
    expect(terminateCalls).toBe(1);

    // Post frame was queued before throw; flushing it must no-op (no second reject / terminate).
    const pendingAfter = scheduler.pending();
    expect(pendingAfter).toBeGreaterThanOrEqual(1);
    expect(() => scheduler.flush(5)).not.toThrow();
    expect(terminateCalls).toBe(1);
    expect(collectCalls).toBe(1);
  });

  it('resolves with timestamps when collectWork succeeds', async () => {
    const scheduler = createManualFrameScheduler(10);
    let nowMs = 1000;

    const pending = runRafCollectSequence({
      scheduleFrame: scheduler.scheduleFrame,
      now: () => {
        nowMs += 1;
        return nowMs;
      },
      scheduleTimeout0: cb => cb(),
      postFrames: 2,
      collectWork: () => ({
        totalMs: 12.5,
        actionCount: 1,
      }),
    });

    // pre, collect, post, post-final → resolve via timeout0
    scheduler.flush(1);
    scheduler.flush(1);
    scheduler.flush(1);
    scheduler.flush(1);

    const result = await pending;
    expect(result.totalMs).toBe(12.5);
    expect(result.actionCount).toBe(1);
    expect(result.frameTimestamps.length).toBeGreaterThanOrEqual(3);
  });
});
