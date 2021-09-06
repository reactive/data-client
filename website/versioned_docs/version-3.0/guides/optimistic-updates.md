---
title: Optimistic Updates
---

Optimistic updates enable highly responsive and fast interfaces by avoiding network wait times.
An update is optimistic by assuming the network is successful. In the case of any errors, Rest
Hooks will then roll back any changes in a way that deals with all possible race conditions.

## Partial updates

One common use case is for quick toggles. Here we demonstrate a publish button for an
article. Note that we need to include the primary key (`id` in this case) in the response
body to ensure the normalized cache gets updated correctly.

### ArticleResource.ts

```typescript
import {
  MutateEndpoint,
  SchemaDetail,
  AbstractInstanceType,
} from 'rest-hooks';
import { Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }

  static partialUpdate<T extends typeof Resource>(
    this: T,
  ): MutateEndpoint<
    (p: Readonly<object>, b: Partial<AbstractInstanceType<T>>) => Promise<any>,
    SchemaDetail<Readonly<AbstractInstanceType<T>>>
  > {
    return super.partialUpdate().extend({
      optimisticUpdate: (params: any, body: any) => ({
        // we absolutely need the primary key here,
        // but won't be sent in a partial update
        id: params.id,
        ...body,
      }),
    });
  }
}
```

### PublishButton.tsx

```typescript
import { useFetcher } from 'rest-hooks';
import ArticleResource from 'ArticleResource';

export default function PublishButton({ id }: { id: string }) {
  const update = useFetcher(ArticleResource.partialUpdate());

  return (
    <button onClick={() => update({ id }, { published: true })}>Publish</button>
  );
}
```

## Optimistic create with instant updates

Optimistic updates can also be combined with [immediate updates](./immediate-updates), enabling updates to
other endpoints instantly. This is most commonly seen when creating new items
while viewing a list of them.

Here we demonstrate what could be used in a list of articles with a modal
to create a new article. On submission of the form it would instantly
add to the list of articles the newly created article - without waiting on a network response.

### ArticleResource.ts

```typescript
import {
  MutateEndpoint,
  AbstractInstanceType,
} from 'rest-hooks';
import { SchemaDetail, Resource } from '@rest-hooks/rest';

export default class ArticleResource extends Resource {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }

  static create<T extends typeof Resource>(
    this: T,
  ): MutateEndpoint<
    (p: Readonly<object>, b: Partial<AbstractInstanceType<T>>) => Promise<any>,
    SchemaDetail<Readonly<AbstractInstanceType<T>>>
  > {
    return super.create().extend({
      optimisticUpdate: (
        params: Readonly<object>,
        body: Readonly<object | string> | void,
      ) => body,
    });
  }
}

export const appendUpdater = (
  newArticleID: string,
  articleIDs: string[] | undefined,
) => [...(articleIDs || []), newArticleID];
```

### CreateArticle.tsx

Since the actual `id` of the article is created on the server, we will need to fill
in a temporary fake `id` here, so the `primary key` can be generated. This is needed
to properly normalize the article to be looked up in the cache.

Once the network responds, it will have a different `id`, which will replace the existing
data. This is often seamless, but care should be taken if the fake `id` is used in any
renders - like to issue subsequent requests. We recommend disabling `edit` type features
that rely on the `primary key` until the network fetch completes.

```typescript
import { useFetcher } from 'rest-hooks';
import uuid from 'uuid/v4';
import ArticleResource from 'ArticleResource';

export default function CreateArticle() {
  const create = useFetcher(ArticleResource.create());
  const submitHandler = useCallback(
    data =>
      // note the fake id we create.
      create({}, { id: uuid(), ...data }, [
        [ArticleResource.list(), {}, appendUpdater],
      ]),
    [create],
  );

  return <Form onSubmit={submitHandler}>{/* rest of form */}</Form>;
}
```

## Optimistic Deletes

Since deletes [automatically update the cache correctly](./immediate-updates#delete) upon fetch success,
making your delete endpoint do this optimistically is as easy as adding the [optimisticUpdate](../api/Endpoint#optimisticupdate-params-body--fakepayload)
function to your options.

We return an empty string because that's the response we expect from the server. Although by
default, the server response is ignored.

```ts
import { Resource, SimpleResource } from '@rest-hooks/rest';
import { MutateEndpoint } from 'rest-hooks';

export default class ArticleResource extends Resource {
  readonly id: string | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly published: boolean = false;

  pk() {
    return this.id;
  }

  static delete<T extends typeof Resource>(
    this: T,
  ): MutateEndpoint<(p: Readonly<object>) => Promise<any>, schemas.Delete<T>> {
    return super.delete().extend({
      optimisticUpdate: (params: any, body: any) => params,
    });
  }
}
```
