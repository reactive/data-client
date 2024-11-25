# @data-client/ssr

## 0.12.15

### Patch Changes

- [`4095003`](https://github.com/reactive/data-client/commit/4095003f40f4f6436a790d108ee13bcae1a2cdfa) Thanks [@ntucker](https://github.com/ntucker)! - Improve compatibility with React 19

## 0.12.14

### Patch Changes

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Expand peerdep support range to include ^0.14.0

## 0.12.13

### Patch Changes

- [#3105](https://github.com/reactive/data-client/pull/3105) [`cf770de`](https://github.com/reactive/data-client/commit/cf770de244ad890b286c59ac305ceb6c3b1288ea) Thanks [@ntucker](https://github.com/ntucker)! - Support 0.13 of @data-client/react

## 0.12.12

### Patch Changes

- [#3095](https://github.com/reactive/data-client/pull/3095) [`aab27d9`](https://github.com/reactive/data-client/commit/aab27d956a9b47c2fd5f79869c1e68373c3e5745) Thanks [@ntucker](https://github.com/ntucker)! - CacheProvider -> DataProvider

  CacheProvider name is still usable

## 0.12.11

### Patch Changes

- [#3080](https://github.com/reactive/data-client/pull/3080) [`559cd8a`](https://github.com/reactive/data-client/commit/559cd8a1bf3d0952eefb37c3e61c01af788a8486) Thanks [@ntucker](https://github.com/ntucker)! - NextJS App Router: Prevent serialization race conditions by stalling client hydration until serialization is complete

## 0.12.10

### Patch Changes

- [`8493e50`](https://github.com/reactive/data-client/commit/8493e509ec737557d7367cd864b6f72a7d3caa27) Thanks [@ntucker](https://github.com/ntucker)! - Update README to include DataProvider (app routes) docs

## 0.12.9

### Patch Changes

- [#3074](https://github.com/reactive/data-client/pull/3074) [`1f1f66a`](https://github.com/reactive/data-client/commit/1f1f66a54219d65019f8c3cea380e627b317bbef) Thanks [@ntucker](https://github.com/ntucker)! - Add DataProvider export to /nextjs namespace.

  This provides 'App Router' compatibility. Simply add it to the root layout, ensuring
  `children` is rendered as a descendent.

  <details open>
  <summary><b>app/layout.tsx</b></summary>

  ```tsx
  import { DataProvider } from '@data-client/react/nextjs';
  import { AsyncBoundary } from '@data-client/react';

  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <DataProvider>
            <header>Title</header>
            <AsyncBoundary>{children}</AsyncBoundary>
            <footer></footer>
          </DataProvider>
        </body>
      </html>
    );
  }
  ```

  </details>

- [#3074](https://github.com/reactive/data-client/pull/3074) [`1f1f66a`](https://github.com/reactive/data-client/commit/1f1f66a54219d65019f8c3cea380e627b317bbef) Thanks [@ntucker](https://github.com/ntucker)! - Compatibility with server/client component build rules

## 0.12.8

### Patch Changes

- [#3071](https://github.com/reactive/data-client/pull/3071) [`7fba440`](https://github.com/reactive/data-client/commit/7fba44050a4e3fdcc37ab8405730b35366c293e1) Thanks [@ntucker](https://github.com/ntucker)! - React 19 JSX runtime compatibility.

  BREAKING CHANGE: Min React version 16.8.4 -> 16.14

  16.14 is the first version of React to include JSX runtime.

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

## 0.12.2

### Patch Changes

- [`1dcc39b`](https://github.com/reactive/data-client/commit/1dcc39b0ee08bbe5d7aed3bec17050bcad58d406) Thanks [@ntucker](https://github.com/ntucker)! - Relax peerDeps to allow older versions

## 0.12.1

### Patch Changes

- Updated dependencies [[`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c), [`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c), [`6e9d36b`](https://github.com/reactive/data-client/commit/6e9d36b6cb287763c0fcc3f07d9f2ef0df619d12)]:
  - @data-client/react@0.12.1
  - @data-client/redux@0.12.1

## 0.11.4

### Patch Changes

- [#3023](https://github.com/reactive/data-client/pull/3023) [`9dea825`](https://github.com/reactive/data-client/commit/9dea825cc979eeb1558f1e686cbbaacee6d137c5) Thanks [@renovate](https://github.com/apps/renovate)! - Compatibility with React 19 by removing defaultProps

## 0.11.0

### Patch Changes

- [`ba636a7`](https://github.com/reactive/data-client/commit/ba636a74e77bf5cb8c2b327e161db09f4c4a7192) Thanks [@ntucker](https://github.com/ntucker)! - Support 0.11.0 of @data-client pkgs

## 0.10.0

### Patch Changes

- [#2912](https://github.com/reactive/data-client/pull/2912) [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474) Thanks [@ntucker](https://github.com/ntucker)! - Expand compatibility

- [`053e823`](https://github.com/reactive/data-client/commit/053e82377bd29f200cd7dfbc700da7a3ad7fa8d7) Thanks [@ntucker](https://github.com/ntucker)! - Update NextJS Demo link

## 0.9.9

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

- [#2895](https://github.com/reactive/data-client/pull/2895) [`2f3667b`](https://github.com/reactive/data-client/commit/2f3667b90f6b73cb6e856970446d891b1a89f733) Thanks [@renovate](https://github.com/apps/renovate)! - Support redux 5

## 0.9.7

### Patch Changes

- [`6c6678bd9d`](https://github.com/reactive/data-client/commit/6c6678bd9d0051c3bf1996c064457ca6f2389c62) Thanks [@ntucker](https://github.com/ntucker)! - docs: README uses svg version of logo

## 0.9.5

### Patch Changes

- [`bb4b9583c5`](https://github.com/reactive/data-client/commit/bb4b9583c52e2b2fe45765af10b385b571901ee7) Thanks [@ntucker](https://github.com/ntucker)! - docs: Update readme

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

## 0.9.3

### Patch Changes

- [#2818](https://github.com/reactive/data-client/pull/2818) [`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles and update names

  - Client packages namespace into RDC
    - @data-client/react - RDC
    - @data-client/core - RDC.Core
    - @data-client/redux - RDC.Redux
  - Definition packages namespace top level
    - @data-client/rest - Rest
    - @data-client/graphql - GraphQL
    - @data-client/img - Img
    - @data-client/endpoint - Endpoint
  - Utility
    - @data-client/normalizr - normalizr
    - @data-client/use-enhanced-reducer - EnhancedReducer

## 0.9.2

### Patch Changes

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

## 0.9.1

### Patch Changes

- [`0cf8f584cc`](https://github.com/reactive/data-client/commit/0cf8f584cc6d6a4635eec4d185063a7eedabebf4) Thanks [@ntucker](https://github.com/ntucker)! - Support 0.9

## 0.8.0

### Patch Changes

- [#2779](https://github.com/reactive/data-client/pull/2779) [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

## 0.2.1

### Patch Changes

- 15d5cc02ec: Support @data-client/react@0.4.0

## 0.2.0

### Minor Changes

- a78831dc61: Support latest version in peerDeps

## 0.1.2

### Patch Changes

- 7b835f113a: Improve package tags
- 6f3b39b585: Only warn about name mangling when using SSR and only once per type

## 0.1.1

### Patch Changes

- 5cacc5d0cd: peerDeps compatibility with next versions
