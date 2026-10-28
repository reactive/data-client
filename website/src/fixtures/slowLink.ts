/** A slow connection, like a phone's on a weak signal: every open download
 * gets an equal share of its bandwidth, so the more downloads are open, the
 * longer each one takes. Cancelling one (its fetch's `signal`) hands its
 * share to the rest, and its promise rejects as fetch() would. */
export function slowLink(bytesPerMs: number) {
  type Download = { left: number; done: () => void };
  const open = new Set<Download>();
  let since = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Credits each open download its share of the time since the last
   * change, applies `change`, then wakes when the next download finishes */
  function settle(change?: () => void) {
    const now = performance.now();
    const share = ((now - since) * bytesPerMs) / open.size;
    since = now;
    for (const download of open) {
      download.left -= share;
      if (download.left < 1) {
        open.delete(download);
        download.done();
      }
    }
    change?.();
    clearTimeout(timer);
    let next = Infinity;
    for (const download of open) next = Math.min(next, download.left);
    if (open.size) timer = setTimeout(settle, (next * open.size) / bytesPerMs);
  }

  return function download(bytes: number, signal?: AbortSignal | null) {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) return reject(signal.reason);
      const cancel = () =>
        settle(() => {
          open.delete(download);
          reject(signal?.reason);
        });
      const download = {
        left: bytes,
        done() {
          signal?.removeEventListener('abort', cancel);
          resolve();
        },
      };
      settle(() => open.add(download));
      signal?.addEventListener('abort', cancel, { once: true });
    });
  };
}
