# Observations

These files rerun cells whose result is React's behavior rather than the
library's: what React does to a woken boundary, which lane a write joins, when
an alternate fiber lets go of a snapshot. Each cell prints its result next to
the one recorded on React 19.3.1. They never fail on a value, so a React
upgrade that changes one does not break the build.

The library's guarantees stay in the gating tests one folder up. A cell that
has both keeps its gating part there and its record here.

They are skipped unless `RDC_OBSERVE=1`:

```bash
RDC_OBSERVE=1 yarn jest --selectProjects Node --testPathPatterns server/stream/__tests__/observed
```

Each file prints one Markdown table. With `RDC_OBSERVE_OUT` set to a path, the
tables are also appended to that file, ready to paste into a pull request:

```bash
RDC_OBSERVE=1 RDC_OBSERVE_OUT=observed.md yarn jest --selectProjects Node --testPathPatterns server/stream/__tests__/observed
```

When a row differs after a React upgrade, read what changed, and update the
recorded value in the file once the new behavior is understood.

| File | Cells |
| --- | --- |
| `keystroke.node.tsx` | K1's control, K2's two rows, K3 |
| `limits.node.tsx` | L1, every parent re-render with and without the adapter; L2 |
| `page.node.tsx` | Lanes behind an application transition, R7, R9, S6, W1, P1 pending at publish |
| `drift.node.tsx` | D6, R1 on a quiet page (and under StrictMode), P1 drift |
