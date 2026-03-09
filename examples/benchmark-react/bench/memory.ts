import type { CDPSession } from 'playwright';

/**
 * Collect JS heap used size (bytes) via Chrome DevTools Protocol.
 * Call HeapProfiler.collectGarbage first to reduce variance.
 */
export async function collectHeapUsed(cdp: CDPSession): Promise<number> {
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const m = metrics.find(
    (metric: { name: string }) => metric.name === 'JSHeapUsedSize',
  );
  return m?.value ?? 0;
}
