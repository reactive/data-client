# @data-client/endpoint

## 0.2.6

### Patch Changes

- 318df89bf7: Add nonFilterArgumentKeys argument to Collection

  `nonFilterArgumentKeys` defines a test to determine which argument keys
  are not used for filtering the results. For instance, if your API uses
  'orderBy' to choose a sort - this argument would not influence which
  entities are included in the response.

  This allows customizing `createCollectionFilter` for the
  most common case

- 1fcaeb1a7b: Fix some versions of RN not working with Collections

  (Array.sort() does not exist in all versions)

## 0.2.5

### Patch Changes

- 5a16f86668: Allowing Collection class override for createCollectionFilter default
- 4317adb94c: Collections with arguments in different orders now correctly mean the same Collection

  This could sometimes result in different instances of a Collection having different values.

## 0.2.4

### Patch Changes

- c8c5575e5a: Ignore 'undefined' parameters in collection matching
- 4e9d34ebc1: Optimistic creates no longer need a 'fake pk'

  e.g.,

  ```ts
  controller.fetch(TodoResource.getList.push, {
    // id: randomId(), THIS IS NO LONGER NEEDED
    userId,
    title: e.currentTarget.value,
  });
  ```

  This is achieved by computing a random id when a pk cannot be
  computed. In development mode non-create endpoints will
  still throw when pk fails.

## 0.2.3

### Patch Changes

- 8a71700644: Add EndpointToFunction type
- 8a71700644: scheam.push/unshift type denormalize to singular item (for now)
- 8a71700644: fix: Support Collections with boolean parameters

## 0.2.2

### Patch Changes

- f4b625df5a: schema.Entity.key should always be enumerable
- 8af1b5a8ef: Detect unusable pk when pk is serialized
- 6f3b39b585: Only warn about name mangling when using SSR and only once per type

## 0.2.1

### Patch Changes

- 69ce1f8b6b: docs: Add some more JSDoc links
- 12c2596453: fix: Ensure Entit.key can be set in v8 browsers
- 6c8f0be900: enhance: Include class/function in error message regarding name mangling

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- 011cc20732: Remove FetchShape compatibility.
  This removes support for the legacy hooks in 'rest-hooks' like useResource()

### Patch Changes

- 9788090c55: Fix Collection creates (like push, unshift) normalizing when no collections are in store
- 9788090c55: Fix Collections handling single item with Union schema
