# @data-client/redux

## 0.8.1

### Patch Changes

- [#2797](https://github.com/data-client/data-client/pull/2797) [`c6ee872c7d`](https://github.com/data-client/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee) Thanks [@ntucker](https://github.com/ntucker)! - Fix published dependency range

- Updated dependencies [[`c6ee872c7d`](https://github.com/data-client/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee)]:
  - @data-client/core@0.8.1

## 0.8.0

### Minor Changes

- [#2787](https://github.com/data-client/data-client/pull/2787) [`8ec35d7143`](https://github.com/data-client/data-client/commit/8ec35d71437c4042c6cb824eceb490d31c36ae21) Thanks [@ntucker](https://github.com/ntucker)! - Remove makeCacheProvider

  Current testing version is already [using the provider Component directly](https://dataclient.io/docs/api/makeRenderDataClient)

  ```tsx
  import { CacheProvider } from '@data-client/react';
  const renderDataClient = makeRenderDataClient(CacheProvider);
  ```

### Patch Changes

- Updated dependencies [[`837cf57883`](https://github.com/data-client/data-client/commit/837cf57883544c7640344a01f43bf6d9e3369083), [`f65cf832f0`](https://github.com/data-client/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04), [`c865415ce5`](https://github.com/data-client/data-client/commit/c865415ce598d2b882262f795c4a816b2aa0808a), [`ff51e71f45`](https://github.com/data-client/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/data-client/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`d3343d42b9`](https://github.com/data-client/data-client/commit/d3343d42b970d075eda201cb85d201313120807c), [`5ff1d65eb5`](https://github.com/data-client/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853)]:
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
