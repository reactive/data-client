import { createAdd } from './filter.js';
import { buildScenarios } from './spread-scenarios.js';

/**
 * Degenerate-case throughput benchmarks for spread operations in the core
 * write path (see spread-scenarios.js for what each scenario isolates).
 *
 * The setOneEntity 1k/10k/100k sweep should show near-linear per-op cost,
 * while the control write stays flat — confirming write cost scales with the
 * size of the written entity's type map, not the whole store.
 */
export default function addSpreadSuite(suite, filter) {
  const add = createAdd(suite, filter);

  // buildScenarios pre-filters so unmatched fixtures are never constructed
  for (const { name, fn } of buildScenarios(filter)) {
    add(name, fn);
  }

  return suite;
}
