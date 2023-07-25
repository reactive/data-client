# @data-client/endpoint

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
