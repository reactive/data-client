import { createAdd } from './filter.js';
import { printStatus } from './printStatus.js';

/**
 * Microbenchmark suite for testing very specific, isolated operations.
 *
 * Use this file to add benchmarks that:
 * - Test individual functions or methods in isolation
 * - Measure specific code paths or optimizations
 * - Compare different implementation approaches
 * - Profile hot paths with minimal setup overhead
 *
 * @param {import('benchmark').Suite} suite
 * @param {string} [filter]
 * @returns {import('benchmark').Suite}
 */
export default function addMicroSuite(suite, filter) {
  const add = createAdd(suite, filter);

  // Add microbenchmarks here
  // Example:
  // add('myMicrobenchmark', () => {
  //   // isolated operation to measure
  // });

  return suite.on('complete', function () {
    if (process.env.SHOW_OPTIMIZATION) {
      console.error('micro bench complete\n');
      // Add printStatus calls for functions you want to check optimization status
    }
  });
}
