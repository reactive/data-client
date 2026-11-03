import vm from 'node:vm';
import v8 from 'v8';

v8.setFlagsFromString('--expose_gc');
export const gc = vm.runInNewContext('gc');

export function fullGC() {
  gc();
  gc();
}

// v8.getHeapStatistics() avoids the /proc rss read that process.memoryUsage() does
export const heapUsed = () => v8.getHeapStatistics().used_heap_size;
