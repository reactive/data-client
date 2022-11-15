---
title: useFetcher()
---
import GenericsTabs from '@site/src/components/GenericsTabs';

<head>
  <meta name="docsearch:pagerank" content="-40"/>
</head>

:::tip

Use [Controller.fetch()](./Controller.md#fetch) instead

:::

<GenericsTabs>

```typescript
function useFetcher(
  endpoint: Endpoint,
  throttle?: boolean = false,
): FetchFunction;

type FetchFunction = (
  params: object,
  body: object | void,
  updateParams?: OptimisticUpdateParams[]
) => Promise<any>;

type OptimisticUpdateParams = [
  destShape: Endpoint,
  destParams: object,
  updateFunction: (sourceResults: object, destResults: object) => object,
];
```

```typescript
function useFetcher<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(
  endpoint: Endpoint<(p: Params, b: Body) => Promise<any>, S>,
  throttle?: boolean = false,
): <
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

</GenericsTabs>

Mostly useful for imperatively triggering mutation effects.

However, this hook is actually used by the retrieval hooks (useFetch(), useCache(), useSuspense()). Using
it with a side-effect free `Endpoint` like `detail()` can be done to force a refresh imperatively.

## throttle?: boolean = false

By default all calls force the fetch, however by calling with throttle=true identical
in-flight requests will be deduped.

## Example

```tsx
function CreatePost() {
  const create = useFetcher(PostResource.create());
  // create as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => create({}, new FormData(e.target))}>{/* ... */}</form>
  );
}
```

```tsx
function UpdatePost({ id }: { id: string }) {
  const update = useFetcher(PostResource.update());
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
  const del = useFetcher(PostResource.delete());
  // del as (body: any, params: Readonly<object>) => Promise<any>

  return (
    <div>
      <h3>{post.title}</h3>
      <button onClick={() => del({ id: post.id })}>X</button>
    </div>
  );
}
```

## updateParams: [destEndpoint, destParams, updateFunction][]

:::caution Deprecated

Use [Endpoint.update](/rest/api/Endpoint#update) instead

:::

The optional third argument to the fetch function returned by `useFetcher()` is a
list of tuples that tell Rest Hooks additional updates that should take place.

The result cache will be updated based on the destEndpoint with destParams applied.
(e.g., `destEndpoint.key(destParams)` would find the location in the cache.)

The third argument is a function to run on that result cache.

### updateFunction: (sourceResults, destResults) => destResults

This function takes two arguments
and returns the new result state to be placed in the destination. (Result state resembles
the shape of the actual response, except all entities are replaced with their primary keys.)
The first argument to the update function is the result of the resolved value of the given fetch call.
The second argument is the existing result state of the destination.

### Example

This will insert the newly created article id onto the end of the list endpoint with `{}` params.

```typescript
const createArticle = useFetcher(ArticleResource.create());

createArticle({}, { id: 1 }, [
  [
    ArticleResource.list(),
    {},
    (newArticleID: string, articleIDs: string[] | undefined) => [
      ...(articleIDs || []),
      newArticleID,
    ],
  ],
]);
```

This shows the same concept, but for a custom list endpoint.

```typescript
class ArticlePaginatedResource extends Resource {
  static list<T extends Resource>() {
    return super.list().extend({
      schema: { results: this[], nextPage: '' },
    });
  }
}
```

```typescript
const createArticle = useFetcher(ArticleResource.create());

createArticle({}, { id: 1 }, [
  [
    ArticlePaginatedResource.list(),
    {},
    (newArticleID: string, articleIDs: { results: string[] } | undefined) => ({
      ...articleIDs,
      results: [...articleIDs?.results, newArticleID],
    }),
  ],
]);
```

## Useful `Endpoint`s to send

[Resource](/rest/5.2/api/resource#provided-and-overridable-methods) provides these built-in:

- create()
- update()
- partialUpdate()
- delete()

Feel free to add your own [Endpoint](/rest/api/Endpoint) as well.

> ### Notes
>
> As this is the most basic hook to dispatch network requests with `rest-hooks` it will run through all normal fetch processing like updating
> the normalized cache, etc.
