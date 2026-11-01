/* index.js is in `sideEffects`, so Turbopack keeps a namespace it re-exports.
 * Building the namespace in this side-effect-free file lets Turbopack drop it
 * when it is unused.
 */
import * as __INTERNAL__ from './internal.js';

export { __INTERNAL__ };
