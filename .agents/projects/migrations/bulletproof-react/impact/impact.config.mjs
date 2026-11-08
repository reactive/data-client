// Impact config for bulletproof-react (apps/react-vite). Run from a data-client checkout:
//   node .agents/projects/migrations/impact/measure.mjs \
//     --config .agents/projects/migrations/bulletproof-react/impact/impact.config.mjs \
//     --baseline <bulletproof-react checkout> --migrated <migrated checkout>
// Each checkout needs apps/react-vite/.env (`cp .env.example .env`): without it the mock API is off and
// every run times out on the landing page.
import feature from './feature.config.mjs';
import flow from './flow.config.mjs';

export default {
  name: 'bulletproof-react',
  // Every path below is relative to this folder in each checkout.
  root: 'apps/react-vite',
  // Applied to both checkouts before building: the mock API's random 300-1000ms latency becomes a fixed 400ms.
  prep: ['fixed-latency.patch'],
  // The patch reads its delay from this variable at build time. The first latency is the primary
  // run; the others repeat the flow, since optimistic updates gain more the slower the server.
  latency: { env: 'VITE_MOCK_DELAY_MS', profiles: [400, 100, 1000] },
  build: 'npx vite build --base=/',
  flow,
  static: {
    include: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    // First match wins; anything else is "app".
    categories: [
      [
        'test',
        [
          '**/__tests__/**',
          '**/*.test.{ts,tsx}',
          'e2e/**',
          'src/testing/**',
          '**/*.stories.tsx',
        ],
      ],
      [
        'data',
        [
          'src/features/*/api/**',
          'src/lib/api-client.ts',
          'src/lib/auth.tsx',
          'src/lib/react-query.ts',
          'src/hooks/use-mutate.ts',
        ],
      ],
    ],
    dist: 'dist',
    // The MSW worker and mock database ship in this demo build and are the same in both variants.
    bundleExclude: [
      'mockServiceWorker.js',
      'assets/db-*.js',
      'assets/browser-*.js',
    ],
    dataLibs: [
      '@tanstack/react-query',
      'react-query-auth',
      '@data-client/react',
      '@data-client/rest',
      'axios',
    ],
  },
  feature,
};
