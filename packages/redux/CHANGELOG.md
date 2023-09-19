# @data-client/redux

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

- Updated dependencies [[`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c)]:
  - @data-client/core@0.9.4

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

- [`327b94bedc`](https://github.com/reactive/data-client/commit/327b94bedc280e25c1766b3a51cc20078bfa1739) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add logo to readme

- Updated dependencies [[`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95), [`327b94bedc`](https://github.com/reactive/data-client/commit/327b94bedc280e25c1766b3a51cc20078bfa1739)]:
  - @data-client/core@0.9.3

## 0.9.2

### Patch Changes

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

- Updated dependencies [[`c9ca31f3f4`](https://github.com/reactive/data-client/commit/c9ca31f3f4f2f6e3174c74172ebc194edbe56bb2), [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e)]:
  - @data-client/core@0.9.2

## 0.9.0

### Minor Changes

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: In dev mode add second suspense boundary for devtool button. This will cause hydration mismatch if packages are not the same.

### Patch Changes

- Updated dependencies [[`a7da00e82d`](https://github.com/reactive/data-client/commit/a7da00e82d5473f12881b85c9736a79e016ee526), [`2d2e94126e`](https://github.com/reactive/data-client/commit/2d2e94126e5962511e250df5d813d056646de41b), [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7)]:
  - @data-client/core@0.9.0

## 0.8.1

### Patch Changes

- [#2797](https://github.com/reactive/data-client/pull/2797) [`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee) Thanks [@ntucker](https://github.com/ntucker)! - Fix published dependency range

- Updated dependencies [[`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee)]:
  - @data-client/core@0.8.1

## 0.8.0

### Minor Changes

- [#2787](https://github.com/reactive/data-client/pull/2787) [`8ec35d7143`](https://github.com/reactive/data-client/commit/8ec35d71437c4042c6cb824eceb490d31c36ae21) Thanks [@ntucker](https://github.com/ntucker)! - Remove makeCacheProvider

  Current testing version is already [using the provider Component directly](https://dataclient.io/docs/api/makeRenderDataClient)

  ```tsx
  import { CacheProvider } from '@data-client/react';
  const renderDataClient = makeRenderDataClient(CacheProvider);
  ```

### Patch Changes

- Updated dependencies [[`837cf57883`](https://github.com/reactive/data-client/commit/837cf57883544c7640344a01f43bf6d9e3369083), [`f65cf832f0`](https://github.com/reactive/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04), [`c865415ce5`](https://github.com/reactive/data-client/commit/c865415ce598d2b882262f795c4a816b2aa0808a), [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`d3343d42b9`](https://github.com/reactive/data-client/commit/d3343d42b970d075eda201cb85d201313120807c), [`5ff1d65eb5`](https://github.com/reactive/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853)]:
  - @data-client/core@0.8.0

## 0.2.2

### Patch Changes

- ccaf9411c2: Support 0.4 @data-client/react

## 0.2.1

### Patch Changes

- Updated dependencies [5cedd4485e]
  - @data-client/core@0.4.0

## 0.2.0

### Minor Changes

- a78831dc61: Support latest version in peerDeps

## 0.1.4

### Patch Changes

- 960b120f56: docs: Update hash links for Managers
- 8eb1d2a651: docs: Update README links for docs site changes

## 0.1.3

### Patch Changes

- e916b88e45: Readme/package meta typo fixes

## 0.1.2

### Patch Changes

- 5cacc5d0cd: peerDeps compatibility with next versions

## 0.1.1

### Patch Changes

- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [9788090c55]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
  - @data-client/core@0.2.0
