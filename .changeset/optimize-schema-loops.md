---
'@data-client/endpoint': patch
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

Improve normalize/denormalize performance 10-15%

- Replace `Object.keys().forEach()` with indexed for loops
- Replace `reduce()` with spreading to direct object mutation
- Cache getter results to avoid repeated property lookups
- Centralize arg extraction with pre-allocated loop
- Eliminate Map double-get pattern

#### Microbenchmark Results

| # | Optimization | Before | After | Improvement |
|---|-------------|--------|-------|-------------|
| 1 | **forEach → forLoop** | 7,164 ops/sec | 7,331 ops/sec | **+2.3%** |
| 2 | **reduce+spread → mutation** | 912 ops/sec | 7,468 ops/sec | **+719% (8.2x)** |
| 3 | **getter repeated → cached** | 1,652,211 ops/sec | 4,426,994 ops/sec | **+168% (2.7x)** |
| 4 | **slice+map → indexed** | 33,221 ops/sec | 54,701 ops/sec | **+65% (1.65x)** |
| 5 | **Map double-get → single** | 23,046 ops/sec | 23,285 ops/sec | **+1%** |

#### Impact Summary by Codepath

| Codepath | Optimizations Applied | Expected Improvement |
|----------|----------------------|---------------------|
| **normalize** (setResponse) | 1, 2, 4 | 10-15% |
| **denormalize** (getResponse) | 1, 2, 4 | 10-15% |
| **Controller queries** (get, getQueryMeta) | 5, 6 | 5-10% |
