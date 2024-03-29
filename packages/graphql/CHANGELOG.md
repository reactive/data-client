# @data-client/graphql

## 0.10.0

### Patch Changes

- [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae) Thanks [@ntucker](https://github.com/ntucker)! - Update README with API links

- Updated dependencies [[`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474), [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae), [`bf9c79c`](https://github.com/reactive/data-client/commit/bf9c79cb42e3df091eafe63fee619764a7ae4350)]:
  - @data-client/endpoint@0.10.0

## 0.9.9

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

- Updated dependencies [[`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8)]:
  - @data-client/endpoint@0.9.9

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

- Updated dependencies [[`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c)]:
  - @data-client/endpoint@0.9.4

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

- Updated dependencies [[`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95)]:
  - @data-client/endpoint@0.9.3

## 0.9.2

### Patch Changes

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

- Updated dependencies [[`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e)]:
  - @data-client/endpoint@0.9.2

## 0.9.0

### Patch Changes

- Updated dependencies [[`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7)]:
  - @data-client/endpoint@0.9.0

## 0.8.2

### Patch Changes

- [`664d3eacff`](https://github.com/reactive/data-client/commit/664d3eacff08c3c75e8ed7c3ccc64ee21faa6f7f) Thanks [@ntucker](https://github.com/ntucker)! - Remove dev warning for old versions of client

- [#2799](https://github.com/reactive/data-client/pull/2799) [`26a3843d1b`](https://github.com/reactive/data-client/commit/26a3843d1b61900c385d8626d7062d6f0424c137) Thanks [@ntucker](https://github.com/ntucker)! - Removed some forms of automatic entity validation

  - Now allow missing schemas making it easier to declare partials
  - Removed logic for certain keys found out of defaults

  We are generally trying to be more lax and focus on catching
  clearly wrong signals. A lot of help comes from network response
  form detection.

- Updated dependencies [[`664d3eacff`](https://github.com/reactive/data-client/commit/664d3eacff08c3c75e8ed7c3ccc64ee21faa6f7f), [`26a3843d1b`](https://github.com/reactive/data-client/commit/26a3843d1b61900c385d8626d7062d6f0424c137)]:
  - @data-client/endpoint@0.8.2

## 0.8.1

### Patch Changes

- [#2797](https://github.com/reactive/data-client/pull/2797) [`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee) Thanks [@ntucker](https://github.com/ntucker)! - Fix published dependency range

## 0.8.0

### Patch Changes

- Updated dependencies [[`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`79e286109b`](https://github.com/reactive/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1)]:
  - @data-client/endpoint@0.8.0

## 0.2.3

### Patch Changes

- a8936f5e6d: Entity.process() now gets an addition argument of 'args' (sent from endpoint)

  ```ts
  class Stream extends Entity {
    username = "";
    title = "";
    game = "";
    currentViewers = 0;
    live = false;

    pk() {
      return this.username;
    }
    static key = "Stream";

    process(value, parent, key, args) {
      const processed = super.process(value, parent, key, args);
      processed.username = args[0]?.username;
      return processed;
    }
  }
  ```

- Updated dependencies [a8936f5e6d]
  - @data-client/endpoint@0.2.8

## 0.2.2

### Patch Changes

- 318df89bf7: Add nonFilterArgumentKeys argument to Collection

  `nonFilterArgumentKeys` defines a test to determine which argument keys
  are not used for filtering the results. For instance, if your API uses
  'orderBy' to choose a sort - this argument would not influence which
  entities are included in the response.

  This allows customizing `createCollectionFilter` for the
  most common case

- Updated dependencies [318df89bf7]
- Updated dependencies [1fcaeb1a7b]
  - @data-client/endpoint@0.2.6

## 0.2.1

### Patch Changes

- 8af1b5a8ef: Detect unusable pk when pk is serialized
- Updated dependencies [f4b625df5a]
- Updated dependencies [8af1b5a8ef]
- Updated dependencies [6f3b39b585]
  - @data-client/endpoint@0.2.2

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- 011cc20732: Remove FetchShape compatibility.
  This removes support for the legacy hooks in 'rest-hooks' like useResource()

### Patch Changes

- 9788090c55: Fix Collection creates (like push, unshift) normalizing when no collections are in store
- 9788090c55: Fix Collections handling single item with Union schema
- Updated dependencies [bf141cb5a5]
- Updated dependencies [9788090c55]
- Updated dependencies [9788090c55]
- Updated dependencies [011cc20732]
  - @data-client/endpoint@0.2.0
