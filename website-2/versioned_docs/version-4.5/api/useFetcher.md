---
title: useFetcher()
id: useFetcher
original_id: useFetcher
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useFetcher(
  fetchShape: FetchShape,
  throttle?: boolean = false,
): FetchFunction;

type FetchFunction = (
  params: object,
  body: object | void,
  updateParams?: OptimisticUpdateParams[]
) => Promise<any>;

type OptimisticUpdateParams = [
  destShape: FetchShape,
  destParams: object,
  updateFunction: (sourceResults: object, destResults: object) => object,
];
```

<!--With Generics-->

```typescript
function useFetcher<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(
  fetchShape: FetchShape<S, Params, Body>,
  throttle?: boolean = false,
): Shape extends DeleteShape<any, any, any>
  ? (params: ParamsFromShape<Shape>, body: BodyFromShape<Shape>) => Promise<any>
  : <
      UpdateParams extends OptimisticUpdateParams<
        SchemaFromShape<Shape>,
        FetchShape<any, any, any>
      >[]
    >(
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
      updateParams?: UpdateParams | undefined,
    ) => Promise<any>;

type OptimisticUpdateParams<
  SourceSchema extends Schema,
  DestShape extends FetchShape<any, any, any>
> = [
  DestShape,
  ParamsFromShape<DestShape>,
  UpdateFunction<SourceSchema, SchemaFromShape<DestShape>>,
];

type UpdateFunction<SourceSchema extends Schema, DestSchema extends Schema> = (
  sourceResults: Normalize<SourceSchema>,
  destResults: Normalize<DestSchema> | undefined,
) => Normalize<DestSchema>;
```

<!--END_DOCUSAURUS_CODE_TABS-->

Mostly useful for imperatively triggering mutation effects.

However, this hook is actually used by the retrieval hooks (useRetrieve(), useCache(), useResource()). Using
it with a `ReadShape` like `detailShape()` can be done to force a refresh imperatively.

## throttle?: boolean = false

By default all calls force the fetch, however by calling with throttle=true identical
in-flight requests will be deduped.

## Example

```tsx
function CreatePost() {
  const create = useFetcher(PostResource.createShape());
  // create as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => create({}, new FormData(e.target))}>{/* ... */}</form>
  );
}
```

```tsx
function UpdatePost({ id }: { id: string }) {
  const update = useFetcher(PostResource.updateShape());
  // update as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => update({ id }, new FormData(e.target))}>
      {/* ... */}
    </form>
  );
}
```

```tsx
function PostListItem({ post }: { post: PostResource }) {
  const del = useFetcher(PostResource.deleteShape());
  // del as (body: any, params: Readonly<object>) => Promise<any>

  return (
    <div>
      <h3>{post.title}</h3>
      <button onClick={() => del({ id: post.id })}>X</button>
    </div>
  );
}
```

## updateParams: [destShape, destParams, updateFunction][]

The optional third argument to the fetch function returned by `useFetcher()` is a
list of tuples that tell Rest Hooks additional updates that should take place.

The result cache will be updated based on the destShape with destParams applied.
(e.g., `destShape.getFetchKey(destParams)` would find the location in the cache.)

The third argument is a function to run on that result cache.

### updateFunction: (sourceResults, destResults) => destResults

This function takes two arguments
and returns the new result state to be placed in the destination. (Result state resembles
the shape of the actual response, except all entities are replaced with their primary keys.)
The first argument to the update function is the result of the resolved value of the given fetch call.
The second argument is the existing result state of the destination.

### Example

This will insert the newly created article id onto the end of the listshape with `{}` params.

```typescript
const createArticle = useFetcher(ArticleResource.createShape());

createArticle({}, { id: 1 }, [
  [
    ArticleResource.listShape(),
    {},
    (newArticleID: string, articleIDs: string[] | undefined) => [
      ...(articleIDs || []),
      newArticleID,
    ],
  ],
]);
```

This shows the same concept, but for a custom listShape.

```typescript
class ArticlePaginatedResource extends Resource {
  static listShape<T extends Resource>() {
    return {
      ...super.listShape(),
      shape: { results: this.asSchema()[], nextPage: '' },
    }
  }
}
```

```typescript
const createArticle = useFetcher(ArticleResource.createShape());

createArticle({}, { id: 1 }, [
  [
    ArticlePaginatedResource.listShape(),
    {},
    (newArticleID: string, articleIDs: { results: string[] } | undefined) => ({
      ...articleIDs,
      results: [...(articleIDs?.results), newArticleID],
    }),
  ],
]);
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- createShape()
- updateShape()
- partialUpdateShape()
- deleteShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.

> ### Notes
>
> As this is the most basic hook to dispatch network requests with `rest-hooks` it will run through all normal fetch processing like updating
> the normalized cache, etc.
