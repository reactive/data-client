export type GatePromise = Promise<void> & { done: boolean; release(): void };

/** A promise the test resolves with `release()`; `done` says whether it has */
export function makeGate(): GatePromise {
  let resolve!: () => void;
  const promise = new Promise<void>(r => {
    resolve = r;
  }) as GatePromise;
  promise.done = false;
  promise.release = () => {
    if (promise.done) return;
    promise.done = true;
    resolve();
  };
  return promise;
}
