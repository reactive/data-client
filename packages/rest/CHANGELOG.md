# @data-client/rest

## 0.7.1

### Patch Changes

- 4317adb94c: Collection based pagination now replaces the non-list members on page

  This allows members like nextPage or 'cursor' to be updated when
  each page is fetched making it easier to know which page to fetch next.

- Updated dependencies [5a16f86668]
- Updated dependencies [4317adb94c]
  - @data-client/endpoint@0.2.5

## 0.7.0

### Minor Changes

- c8c5575e5a: Add 'paginationField' parameter to [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint#paginationfield) and [createResource](https://dataclient.io/rest/api/createResource#paginationfield)

  This adds a '[getPage](https://dataclient.io/rest/api/RestEndpoint#getPage)' member; similar to getList.push/unshift but for [pagination](https://dataclient.io/rest/guides/pagination).

  ```ts
  const TodoResource = createResource({
    path: '/todos/:id',
    schema: Todo,
    paginationField: 'page',
  }).getList.getPage({ page: '2' });
  ```

### Patch Changes

- c8c5575e5a: Fix case where sometimes paginating would not update a collection

  This was due to the comparison not using string serialization (canonical form for collection comparisons)

- c8c5575e5a: Ignore 'undefined' parameters in collection matching
- Updated dependencies [c8c5575e5a]
- Updated dependencies [4e9d34ebc1]
  - @data-client/endpoint@0.2.4

## 0.6.0

### Minor Changes

- af8b76079f: Support FormData in Resource updates and creates

## 0.5.0

### Minor Changes

- 51b4b0d188: Deprecate Resource.create
- 51b4b0d188: Add Resource.extend()

  This is polymorphic, and has three forms

  Set any field based on arguments:

  ```ts
  Resource.extend('fieldName', { path: 'mypath/:id' });
  ```

  Override any of the provided endpoints with options:

  ```ts
  Resource.extend({
    getList: {
      path: 'mypath/:id',
    },
    update: {
      body: {} as Other,
    },
  });
  ```

  Function to compute derived endpoints:

  ```ts
  Resource.extend(base => ({
    getByComment: base.getList.extend({
      path: 'repos/:owner/:repo/issues/comments/:comment/reactions',
    }),
  }));
  ```

  Idea credits: @Dav3rs

- 51b4b0d188: Remove createResource pagination field in favor of getList.paginated

### Patch Changes

- 51b4b0d188: Fix endpoint.push/unshift/assign method type

## 0.4.1

### Patch Changes

- 6e790725ae: Add more docstrings to RestEndpoint members
- 27274bcf21: Allow DELETE to have body if specified

## 0.4.0

### Minor Changes

- 8a71700644: push/unshift/assign inherit body type

### Patch Changes

- 8a71700644: scheam.push/unshift type denormalize to singular item (for now)
- 8a71700644: fix: Support Collections with boolean parameters
- Updated dependencies [8a71700644]
- Updated dependencies [8a71700644]
- Updated dependencies [8a71700644]
  - @data-client/endpoint@0.2.3

## 0.3.1

### Patch Changes

- 7b835f113a: Improve package tags
- 8af1b5a8ef: Detect unusable pk when pk is serialized
- Updated dependencies [f4b625df5a]
- Updated dependencies [8af1b5a8ef]
- Updated dependencies [6f3b39b585]
  - @data-client/endpoint@0.2.2

## 0.3.0

### Minor Changes

- ab9c805a6c: Add createResource() paginationField argument
  When supplied, will enable Resource.getNextPage

### Patch Changes

- 1efd401bef: fix(types): RestEndpoint.push/unshift/assign return type is no longer nested Promises
- 12c2596453: fix: Ensure Entit.key can be set in v8 browsers
- 1efd401bef: enhance: createResource() throws with path not containing any :path
- Updated dependencies [69ce1f8b6b]
- Updated dependencies [12c2596453]
- Updated dependencies [6c8f0be900]
  - @data-client/endpoint@0.2.1

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- 9788090c55: RestEndpoint's getRequestInit and getHeaders optionally return a promise
- 9788090c55: GetEndpoint and MutateEndpoint parameters changed to what NewXEndpoint was.
- 9788090c55: createResource() generics changed to O extends ResourceGenerics
  This allows customizing the Resource type with body and searchParams
- 9788090c55: createResource().getList uses a Collection, which .create appends to
  Remove any Endpoint.update as it is not necessary and will not work
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
