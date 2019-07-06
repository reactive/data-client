---
title: URL Patterns
---

Common REST urls resemble the following:

- `/static_root/`
  - GET - retrieve list of resources
    - optionally include search params `/static_root/?size=20&page=5`
  - POST - create resource
- `/static_root/[id]/`
  - GET - retrieve one entity matching 'id'
  - PUT - update entire entity
  - PATCH - update partial entity
  - DELETE - delete entity

[Resource](../api/resource) comes out of the box with support for these patterns simply
by defining the `static urlRoot` property on a Resource.

```typescript
export default ArticleResource extends Resource {
  readonly id: string = '';
  //...

  pk() { return this.id; }
  static urlRoot = '/articles/';
}
```

It does this by using that `urlRoot` static property in two static methods:

- [url(urlParams)](../api/resource#static-url-t-extends-typeof-resource-urlparams-partial-abstractinstancetype-t-string)
  - handles most Fetch Shapes
- [listUrl(searchParams)](../api/resource#static-listurl-t-extends-typeof-resource-searchparams-readonly-record-string-string-string)
  - used in createShape() and listShape()

```typescript
ArticleResource.listUrl();
// "/articles/"
ArticleResource.listUrl({ size: 20, page: 5 });
// "/articles/?size=20&page=5"
ArticleResource.url({ id: 5 });
// "/articles/5/"
```

Customizing the url patterns is typically as easy as overriding either of these
methods. However, in more extreme scenarios, [getUrl()](../api/FetchShape#geturlparams-param-string)
can be set in a custom FetchShape definition.

## Example

A somewhat common pattern is to hold 'sub' resources at nested paths to their 'master'.

We might see something like `/articles/[articleId]/comments/` to get the comments for
a given article.

```typescript
export default class CommentResource extends Resource {
  readonly id: string = '';

  pk() { return this.id; }

  // since we won't be using urlRoot to build our urls we
  // still need to tell rest hooks how to uniquely identify this Resource
  static getKey() {
    return 'CommentResource';
  }

  /**
   * Get the url for a Resource
   */
  static url<T extends typeof Resource>(
    this: T,
    urlParams?: { articleId: string } & Partial<AbstractInstanceType<T>>,
  ): string {
    if (urlParams) {
      if (this.pk(urlParams) !== null) {
        return `/articles/${articleId}/comments/${this.pk(urlParams)}`;
      }
    }
    // since we're overriding the url() function we must keep the type the
    // same, which means we might not get urlParams
    throw new Error('Comments require articleId to retrieve');
  }

  /**
   * Get the url for many Resources
   */
  static listUrl<T extends typeof Resource>(
    this: T,
    searchParams?: { articleId: string } & Readonly<Record<string, string | number>>,
  ): string {
    if (searchParams && Object.keys(searchParams).length) {
      const { articleId, ...realSearchParams } = searchParams;
      const params = new URLSearchParams(realSearchParams as any);
      // this is essential for consistent url strings
      params.sort();
      return `/articles/${articleId}/comments/?${params.toString()}`;
    }
    throw new Error('Comments require articleId to retrieve');
  }
}
```

```typescript
CommentResource.listUrl();
// error thrown
CommentResource.listUrl({ articleId: '5' });
// "/articles/${articleId}/comments/"
CommentResource.listUrl({ articleId: '5', size: 20, page: 5 });
// "/articles/${articleId}/comments/?size=20&page=5"
CommentResource.url({ id: 5 });
// error thrown
CommentResource.url({ articleId: '5', id: '23' });
// "/articles/5/comments/23/"
```
