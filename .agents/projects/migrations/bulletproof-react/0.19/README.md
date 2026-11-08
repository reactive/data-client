# bulletproof-react on data-client 0.19 beta

`alan2207/bulletproof-react` @ `9506629` (`apps/react-vite`), `@data-client/*` `0.19.0-beta-20261108175612-3ae266b`
from npm `@beta`, skills linked by `npx --no data-client-skills`, codemod from `npx @data-client/codemods`.
Sonnet 5.5 medium, guided only by the setup skill and TanStack guide.

- [`problems.md`](./problems.md): status of P1-P12 on 0.19, and new problems N1-N4 (each with a pass criterion).
- [`migration.patch`](./migration.patch): the migration diff (lockfile left out). Every mutation is optimistic.
- [`results/impact.md`](./results/impact.md): impact report, 8 interleaved runs at 4x CPU, mock latency fixed at 400ms.

Validation: `tsc` clean, `eslint` 0 errors, vitest 21/21 on the default config, playwright 5/5 (baseline 3/5).

Speed (react-query time / data-client time): mutations to UI 4.2x (delete discussion 16x, update discussion 12x,
create discussion 1.0x), all flow steps 2.3x, cold load 1.0x, slowest interaction 0.61x (39% slower, see N4).
Main chunk gzip -8%, data layer LoC -66%, app LoC +0.9%.
Not re-run on 0.19: tokens per feature, the P12 partial-migration eval.
