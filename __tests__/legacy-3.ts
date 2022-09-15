import {
  AbstractInstanceType,
  DeleteShape,
  MutateShape,
  ReadShape,
} from '@rest-hooks/core';
import { schema } from '@rest-hooks/endpoint';
import {
  Endpoint,
  EndpointExtraOptions,
  SchemaList,
  SchemaDetail,
} from '@rest-hooks/endpoint';
import { rest3 } from '@rest-hooks/legacy';
import React from 'react';
import { SimpleRecord } from '@rest-hooks/legacy';

export const { Resource } = rest3;

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
  readonly author: UserResource | null = null;
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
        this.fetch(this.url({ ...params, includeUser: true }), {
          method: 'get',
        }),
      schema: this,
    };
  }

  static listWithUserShape<T extends typeof ArticleResource>(
    this: T,
  ): ReadShape<SchemaList<AbstractInstanceType<T>>> {
    const baseShape = this.listShape();
    return {
      ...baseShape,
      getFetchKey: (params: Readonly<Record<string, string>>) =>
        baseShape.getFetchKey({ ...params, includeUser: true }),
      fetch: (params: object) =>
        this.fetch(this.listUrl({ ...params, includeUser: 'true' }), {
          method: 'get',
        }),
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
        ...this.getEndpointExtra(),
        optimisticUpdate: (params: any, body: any) => ({
          id: params.id,
          ...body,
        }),
      },
    };
  }

  static deleteShape<T extends typeof Resource>(
    this: T,
  ): DeleteShape<schema.Delete<T>, Readonly<object>> {
    return {
      ...(super.deleteShape() as any),
      options: {
        ...this.getEndpointExtra(),
        optimisticUpdate: (params: any) => params,
      },
    };
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
  ): ReadShape<SchemaList<AbstractInstanceType<T>>> {
    const getFetchKey = () => this.otherListUrl();
    return {
      ...this.listShape(),
      getFetchKey,
      fetch: (_params: object) =>
        this.fetch(getFetchKey(), {
          method: 'get',
        }),
    };
  }

  static otherListUrl<T extends typeof ArticleResource>(this: T): string {
    return this.urlRoot + 'some-list-url';
  }

  static createShape<T extends typeof Resource>(this: T) {
    return {
      ...super.createShape(),
      options: {
        ...this.getEndpointExtra(),
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

export const CoolerArticleDetail = new Endpoint(({ id }: { id: number }) => {
  return fetch(`http://test.com/article-cooler/${id}`).then(res =>
    res.json(),
  ) as Promise<{
    [k in keyof CoolerArticleResource]: CoolerArticleResource[k];
  }>;
});

export class IndexedUserResource extends UserResource {
  static indexes = ['username' as const];

  static indexShape<T extends typeof IndexedUserResource>(this: T) {
    return {
      type: 'read',
      schema: this,
      getFetchKey({ username }: { username: string }) {
        return username;
      },
    };
  }
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
  static listShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: { results: [this], prevPage: '', nextPage: '' },
    };
  }

  static listDefaultsShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: makePaginatedRecord(this),
    };
  }

  static detailShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: { data: this },
    };
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

  static detailShape<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaDetail<AbstractInstanceType<T>>> {
    const sch = new schema.Union(
      {
        first: FirstUnionResource,
        second: SecondUnionResource,
      },
      'type',
    );
    return {
      ...super.detailShape(),
      schema: sch,
    };
  }

  static listShape<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaList<AbstractInstanceType<T>>> {
    const sch = [
      new schema.Union(
        {
          first: FirstUnionResource,
          second: SecondUnionResource,
        },
        (input: FirstUnionResource | SecondUnionResource) => input['type'],
      ),
    ];
    return {
      ...super.detailShape(),
      schema: sch,
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
