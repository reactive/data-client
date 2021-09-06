---
title: useCacheLegacy()
id: useCacheLegacy
original_id: useCacheLegacy
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useCacheLegacy(
  fetchShape: ReadShape,
  params: object | null
): SchemaOf<typeof fetchShape.schema> | null;
```

<!--With Generics-->

```typescript
function useCacheLegacy<Params extends Readonly<object>, S extends Schema>(
  { schema, getFetchKey }: ReadShape<S, Params>,
  params: Params | null
): SchemaOf<S> | null;
```

<!--END_DOCUSAURUS_CODE_TABS-->

> ### Rest Hooks 3.1 - Removal
>
> This hook is deprecated in favor of [useCache()](./useCache)
>
> - 3.1 will remove `useCacheLegacy()`

Excellent to use data in the normalized cache without fetching.

- [On Error (404, 500, etc)](https://www.restapitutorial.com/httpstatuscodes.html):
  - Returns previously cached if exists
  - null otherwise
- While loading:
  - Returns previously cached if exists
  - null otherwise

## Example

Using a type guard to deal with null

```tsx
function Post({ id }: { id: number }) {
  const post = useCacheLegacy(PostResource.detailShape(), { id });
  // post as PostResource | null
  if (!post) return null;
  // post as PostResource (typeguarded)
  // ...render stuff here
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detailShape()
- listShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.
