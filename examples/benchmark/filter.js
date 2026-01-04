/**
 * Creates a filtered add function for benchmark suites.
 *
 * Filter syntax:
 * - "text"   → substring match (contains)
 * - "^text"  → starts with match
 *
 * @param {Benchmark.Suite} suite
 * @param {string} [filter]
 * @returns {(name: string, fn: () => void) => void}
 */
export function createAdd(suite, filter) {
  const match = createMatcher(filter);
  return (name, fn) => {
    if (match(name)) {
      suite.add(name, fn);
    }
  };
}

/**
 * @param {string} [filter]
 * @returns {(name: string) => boolean}
 */
function createMatcher(filter) {
  if (!filter) return () => true;
  if (filter.startsWith('^')) {
    const prefix = filter.slice(1);
    return name => name.startsWith(prefix);
  }
  return name => name.includes(filter);
}
