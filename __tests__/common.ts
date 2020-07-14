import {
  Resource,
  SchemaList,
  schemas,
  ReadShape,
  SchemaDetail,
} from 'rest-hooks';
import {
  AbstractInstanceType,
  MutateShape,
  SimpleRecord,
} from '@rest-hooks/core';
import { Endpoint, EndpointExtraOptions } from '@rest-hooks/endpoint';
import React from 'react';
import {
  Endpoint,
  EndpointInterface,
  FetchFunction,
  EndpointInstance,
} from '@rest-hooks/endpoint';
import { EntityInterface } from 'packages/normalizr/src/schema';

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

  static longLiving<T extends typeof Resource>(this: T) {
    return this.detail().extend({ dataExpiryLength: 1000 * 60 * 60 });
  }

  static neverRetryOnError<T extends typeof Resource>(this: T) {
    return this.detail().extend({ errorExpiryLength: Infinity });
  }

  static singleWithUser<T extends typeof ArticleResource>(this: T) {
    const endpoint = this.detail();
    return endpoint.extend({
      key: (params: Readonly<object>) =>
        endpoint.key({ ...params, includeUser: true }),
      fetch: (params: object) =>
        this.fetch(this.url({ ...params, includeUser: true }), {
          method: 'get',
        }),
      schema: this,
    });
  }

  static listWithUser<T extends typeof ArticleResource>(this: T) {
    const endpoint = this.list();
    return endpoint.extend({
      key: (params: Readonly<object>) =>
        endpoint.key({ ...params, includeUser: true }),
      fetch: (params: object) =>
        this.fetch(this.listUrl({ ...params, includeUser: 'true' }), {}),
      schema: [this],
    });
  }

  static partialUpdate<T extends typeof Resource>(this: T) {
    return super.partialUpdateShape().extend({
      optimisticUpdate: (params: any, body: any) => ({
        id: params.id,
        ...body,
      }),
    });
  }

  static delete<T extends typeof Resource>(
    this: T,
  ): EndpointInstance<FetchFunction, schemas.Delete<T>, true> {
    return super.deleteShape().extend({
      optimisticUpdate: (params: any, _body: any) => params,
    });
  }
}

export class ArticleTimedResource extends ArticleResource {
  readonly createdAt = new Date(0);

  static schema = {
    ...ArticleResource.schema,
    createdAt: Date,
  };

  static urlRoot = 'http://test.com/article-time/';
}

export class UrlArticleResource extends ArticleResource {
  readonly url: string = 'happy.com';
}

export class ArticleResourceWithOtherListUrl extends ArticleResource {
  static otherListShape<T extends typeof ArticleResourceWithOtherListUrl>(
    this: T,
  ) {
    const key = () => this.otherListUrl();
    return this.list().extend({
      key,
      fetch: (_params: object) =>
        this.fetch(key(), {
          method: 'get',
        }),
    });
  }

  static otherListUrl<T extends typeof ArticleResource>(this: T): string {
    return this.urlRoot + 'some-list-url';
  }

  static create<T extends typeof Resource>(
    this: T,
  ): EndpointInstance<FetchFunction, T, true> {
    return super.create().extend({
      optimisticUpdate: (
        params: Readonly<object>,
        body: Readonly<object | string> | void,
      ) => body,
    }) as any;
  }
}

export class CoolerArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
  }
}

export const CoolerArticleDetail = new Endpoint(({ id }: { id: number }) => {
  return fetch(`http://test.com/article-cooler/${id}`).then(res =>
    res.json(),
  ) as Promise<
    { [k in keyof CoolerArticleResource]: CoolerArticleResource[k] }
  >;
});

export class IndexedUserResource extends UserResource {
  static indexes = ['username'] as const;
}

export class InvalidIfStaleArticleResource extends CoolerArticleResource {
  static getEndpointExtra(): EndpointExtraOptions {
    return {
      ...super.getEndpointExtra(),
      dataExpiryLength: 5000,
      errorExpiryLength: 5000,
      invalidIfStale: true,
    };
  }
}

export class PollingArticleResource extends ArticleResource {
  static getEndpointExtra(): EndpointExtraOptions {
    return {
      ...super.getEndpointExtra(),
      pollFrequency: 5000,
    };
  }

  static pusher<T extends typeof PollingArticleResource>(this: T) {
    return this.detail().extend({
      extra: {
        eventType: 'PollingArticleResource:fetch',
      },
    });
  }
}

export class StaticArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-static/';

  static EndpointExtraOptions() {
    return {
      ...super.getEndpointExtra(),
      dataExpiryLength: Infinity,
    };
  }
}

class OtherArticleResource extends CoolerArticleResource {}

function makePaginatedRecord<T>(entity: T) {
  return class PaginatedRecord extends SimpleRecord {
    readonly prevPage = '';
    readonly nextPage = '';
    readonly results: AbstractInstanceType<T>[] = [];
    static schema = { results: [entity] };
  };
}

export class PaginatedArticleResource extends OtherArticleResource {
  static urlRoot = 'http://test.com/article-paginated/';
  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: { results: [this], prevPage: '', nextPage: '' },
    });
  }

  static listDefaults<T extends typeof Resource>(this: T) {
    return this.list().extend({
      schema: makePaginatedRecord(this),
    });
  }

  static detail<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: { data: this },
    });
  }
}

export const ListPaginatedArticle = new Endpoint(
  (params: Readonly<Record<string, string | number>>) => {
    return PaginatedArticleResource.fetch(
      PaginatedArticleResource.listUrl(params),
      PaginatedArticleResource.getFetchInit({ method: 'GET' }),
    );
  },
  {
    schema: makePaginatedRecord(PaginatedArticleResource),
  },
);

export class UnionResource extends Resource {
  readonly id: string = '';
  readonly body: string = '';
  readonly type: string = '';

  pk() {
    return this.id;
  }

  static urlRoot = '/union/';

  static detail<T extends typeof Resource>(this: T) {
    return super.detail().extend({
      schema: new schemas.Union(
        {
          first: FirstUnionResource,
          second: SecondUnionResource,
        },
        'type',
      ),
    });
  }

  static list<T extends typeof Resource>(this: T) {
    return super.detail().extend({
      schema: [
        new schemas.Union(
          {
            first: FirstUnionResource,
            second: SecondUnionResource,
          },
          (input: FirstUnionResource | SecondUnionResource) => input['type'],
        ),
      ],
    });
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

export const noEntitiesShape = {
  type: 'read' as const,
  schema: { firstThing: '', someItems: [] as { a: number }[] },
  getFetchKey({ userId }: { userId: string }) {
    return `/users/${userId}/simple`;
  },
  fetch: async ({ userId }: { userId: string }) => {
    return await (await fetch(`http://test.com/users/${userId}/simple`)).json();
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
