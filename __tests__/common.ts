import {
  Resource,
  SchemaList,
  schemas,
  ReadShape,
  SchemaDetail,
  DeleteShape,
} from 'rest-hooks';
import { AbstractInstanceType, FetchOptions, MutateShape } from 'rest-hooks';
import React from 'react';

export class UserResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/user/';
}
export class ArticleResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static schema = {
    author: UserResource,
  };

  static urlRoot = 'http://test.com/article/';
  static url<T extends typeof Resource>(this: T, urlParams?: any): string {
    if (urlParams && !urlParams.id) {
      return `${this.urlRoot}${urlParams.title}`;
    }
    return super.url(urlParams);
  }

  static longLivingRequest<T extends typeof Resource>(this: T) {
    const single = this.detailShape();
    return {
      ...single,
      options: {
        ...single.options,
        dataExpiryLength: 1000 * 60 * 60,
      },
    };
  }

  static neverRetryOnErrorRequest<T extends typeof Resource>(this: T) {
    const single = this.detailShape();
    return {
      ...single,
      options: {
        ...single.options,
        errorExpiryLength: Infinity,
      },
    };
  }

  static singleWithUserRequest<T extends typeof ArticleResource>(
    this: T,
  ): ReadShape<SchemaDetail<AbstractInstanceType<T>>> {
    const baseShape = this.detailShape();
    return {
      ...baseShape,
      getFetchKey: (params: Readonly<Record<string, string>>) =>
        baseShape.getFetchKey({ ...params, includeUser: true }),
      fetch: (params: object) =>
        this.fetch('get', this.url({ ...params, includeUser: true })),
      schema: this,
    };
  }

  static listWithUserRequest<T extends typeof ArticleResource>(
    this: T,
  ): ReadShape<SchemaList<AbstractInstanceType<T>>> {
    const baseShape = this.listShape();
    return {
      ...baseShape,
      getFetchKey: (params: Readonly<Record<string, string>>) =>
        baseShape.getFetchKey({ ...params, includeUser: true }),
      fetch: (params: object) =>
        this.fetch('get', this.listUrl({ ...params, includeUser: 'true' })),
      schema: [this],
    };
  }

  static partialUpdateShape<T extends typeof Resource>(
    this: T,
  ): MutateShape<
    SchemaDetail<Readonly<AbstractInstanceType<T>>>,
    Readonly<object>,
    Partial<AbstractInstanceType<T>>
  > {
    return {
      ...super.partialUpdateShape(),
      options: {
        ...this.getFetchOptions(),
        optimisticUpdate: (params: any, body: any) => ({
          id: params.id,
          ...body,
        }),
      },
    };
  }

  static deleteShape<T extends typeof Resource>(
    this: T,
  ): DeleteShape<any, Readonly<object>> {
    return {
      ...super.deleteShape(),
      options: {
        ...this.getFetchOptions(),
        optimisticUpdate: (_params: any, _body: any) => '',
      },
    };
  }
}

export class UrlArticleResource extends ArticleResource {
  readonly url: string = 'happy.com';
}

export class ArticleResourceWithOtherListUrl extends ArticleResource {
  static otherListShape<T extends typeof ArticleResourceWithOtherListUrl>(
    this: T,
  ): ReadShape<SchemaList<AbstractInstanceType<T>>> {
    const getFetchKey = () => this.otherListUrl();
    return {
      ...this.listShape(),
      getFetchKey,
      fetch: (_params: object) => this.fetch('get', getFetchKey()),
    };
  }

  static otherListUrl<T extends typeof ArticleResource>(this: T): string {
    return this.urlRoot + 'some-list-url';
  }

  static createShape<T extends typeof Resource>(this: T) {
    return {
      ...super.createShape(),
      options: {
        ...this.getFetchOptions(),
        optimisticUpdate: (
          params: Readonly<object>,
          body: Readonly<object | string> | void,
        ) => body,
      },
    };
  }
}

export class CoolerArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
  }
}

export class IndexedUserResource extends UserResource {
  static indexes = ['username' as const];
}

export class InvalidIfStaleArticleResource extends CoolerArticleResource {
  static getFetchOptions(): FetchOptions {
    return {
      ...super.getFetchOptions(),
      dataExpiryLength: 5000,
      errorExpiryLength: 5000,
      invalidIfStale: true,
    };
  }
}

export class PollingArticleResource extends ArticleResource {
  static getFetchOptions(): FetchOptions {
    return {
      ...super.getFetchOptions(),
      pollFrequency: 5000,
    };
  }

  static pusherShape<T extends typeof PollingArticleResource>(this: T) {
    return {
      ...this.detailShape(),
      options: {
        extra: {
          eventType: 'PollingArticleResource:fetch',
        },
      },
    };
  }
}

export class StaticArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-static/';

  static getFetchOptions() {
    return {
      ...super.getFetchOptions(),
      dataExpiryLength: Infinity,
    };
  }
}

class OtherArticleResource extends CoolerArticleResource {}

export class PaginatedArticleResource extends OtherArticleResource {
  static urlRoot = 'http://test.com/article-paginated/';
  static listShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: { results: [this], prevPage: '', nextPage: '' },
    };
  }

  static detailShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: { data: this },
    };
  }
}

export class UnionResource extends Resource {
  readonly id: string = '';
  readonly body: string = '';
  readonly type: string = '';

  pk() {
    return this.id;
  }

  static urlRoot = '/union/';

  static detailShape<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaDetail<AbstractInstanceType<T>>> {
    const schema = new schemas.Union(
      {
        first: FirstUnionResource,
        second: SecondUnionResource,
      },
      'type',
    );
    return {
      ...super.detailShape(),
      schema,
    };
  }

  static listShape<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaList<AbstractInstanceType<T>>> {
    const schema = [
      new schemas.Union(
        {
          first: FirstUnionResource,
          second: SecondUnionResource,
        },
        (input: FirstUnionResource | SecondUnionResource) => input['type'],
      ),
    ];
    return {
      ...super.detailShape(),
      schema,
    };
  }
}
export class FirstUnionResource extends UnionResource {
  readonly type = 'first' as const;
  readonly firstOnlyField: number = 5;
}
export class SecondUnionResource extends UnionResource {
  readonly type = 'second' as const;
  readonly secondeOnlyField: number = 10;
}

export class NestedArticleResource extends OtherArticleResource {
  readonly user: number | null = null;

  static schema = {
    ...OtherArticleResource.schema,
    user: UserResource,
  };
}

export const photoShape = {
  type: 'read' as const,
  schema: null as ArrayBuffer | null,
  getFetchKey({ userId }: { userId: string }) {
    return `/users/${userId}/photo`;
  },
  fetch: async ({ userId }: { userId: string }) => {
    const response = await fetch(`http://test.com/users/${userId}/photo`);
    const photoArrayBuffer = await response.arrayBuffer();

    return photoArrayBuffer;
  },
};

export function makeErrorBoundary(cb: (error: any) => void) {
  return class ErrorInterceptor extends React.Component<any, { error: any }> {
    state = { error: null };
    componentDidCatch(error: any) {
      this.setState({ error });
      cb(error);
    }

    render() {
      if (this.state.error) return null;
      return this.props.children;
    }
  };
}

describe('ArticleResource', () => {
  it('should use defaults', () => {
    const a = ArticleResource.fromJS({});
    expect(a.title).toBe('');
  });
});
