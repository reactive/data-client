---
name: data-client-performance
description: Find and make the speedups a React app on @data-client/react may be missing - detail pages from list data, one Entity per server object, lists updated in place, reads that skip fresh data, loaders that don't wait for secondary data, prefetching, expiry, optimistic updates, Query memoization, parallel reads, transitions, stable references and React Compiler. Use for the optional performance pass after a migration, or when asked to make data loading, navigation or mutations faster.
license: Apache 2.0
---

# Performance pass

Read [references/performance-pass.md](references/performance-pass.md); its sections are the checks.

1. **Measure** the flows the app's users run most, as its "Measure first" section says.
2. **Audit.** For every check, search the code and list each finding with its file and line, the change, and what
   users will see. Report a check with no findings as clean.
3. **Built-in wins** take little code: check each is in place and make any that are missing.
4. **Changes with tradeoffs:** show the list, then make the ones the user wants. A request for a performance pass with
   no narrower scope covers all of them; the user opts out of any by name. Make one change at a time and run the tests
   after each; when a test asserts the old behavior the check names (a page-wide spinner, an update that waits for the
   server), update it and say so.
   Changes to dependencies or build config, such as React Compiler or a React upgrade, are always offered, never made
   unasked; see the "React 19 and React Compiler" section.
5. **Report** as the guide's "Report" section says.
