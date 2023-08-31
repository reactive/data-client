# Change Log

## 0.8.0

### Minor Changes

- [#2784](https://github.com/data-client/data-client/pull/2784) [`c535f6c0ac`](https://github.com/data-client/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGES:

  - DELETE removed -> INVALIDATE
  - drop all support for legacy schemas
    - entity.expiresAt removed
    - Collections.infer does entity check
    - all Entity overrides for backcompat are removed - operates just like EntitySchema, except with extra validation

- [#2795](https://github.com/data-client/data-client/pull/2795) [`79e286109b`](https://github.com/data-client/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: [Schema Serializers](https://dataclient.io/rest/guides/network-transform#deserializing-fields) _must_ support function calls

  This means Date will no longer work like before. Possible migrations:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = 'Ticker';

    static schema = {
      price: Number,
      time: Temporal.Instant.from,
    };
  }
  ```

  or to continue using Date:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = 'Ticker';

    static schema = {
      price: Number,
      time: (iso: string) => new Date(iso),
    };
  }
  ```

- [#2792](https://github.com/data-client/data-client/pull/2792) [`35ccedceb5`](https://github.com/data-client/data-client/commit/35ccedceb53d91dd54dd996990c7c75719be2b85) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Serializer schemas are only processed during denormalization

### Patch Changes

- [#2779](https://github.com/data-client/data-client/pull/2779) [`ff51e71f45`](https://github.com/data-client/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

## 0.2.2

### Patch Changes

- 7b835f113a: Improve package tags

## 0.2.1

### Patch Changes

- 954e06e839: docs: Update README

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse

### Patch Changes

- 87475a0cae: Mark expiresAt and useIncoming as deprecated in the public interface (still fine internally)
