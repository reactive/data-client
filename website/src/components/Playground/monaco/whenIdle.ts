const queue: (() => void)[] = [];
let holds = 0;
let scheduled = false;

/**
 * Runs `task` once the page is idle and nothing holds it (holdIdle): one
 * task per idle period, in the order asked, so deferred work never holds up
 * what the reader sees. Returns a cancel.
 */
export function whenIdle(task: () => void): () => void {
  queue.push(task);
  schedule();
  return () => {
    const index = queue.indexOf(task);
    if (index >= 0) queue.splice(index, 1);
  };
}

/** Holds back whenIdle's tasks until the returned release (safe to call
 * twice), e.g. while a shown editor has yet to paint */
export function holdIdle(): () => void {
  holds += 1;
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    holds -= 1;
    schedule();
  };
}

function schedule() {
  if (scheduled || holds || !queue.length) return;
  scheduled = true;
  const run = () => {
    scheduled = false;
    // held since this was asked: the release asks again
    if (holds) return;
    queue.shift()?.();
    schedule();
  };
  // Safari has no requestIdleCallback
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run);
  else setTimeout(run, 100);
}
