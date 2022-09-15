import { AbstractInstanceType, schema } from '@rest-hooks/endpoint';
import { SimpleRecord } from '@rest-hooks/legacy';
import {
  AbortOptimistic,
  Endpoint,
  EndpointExtraOptions,
  FetchFunction,
  Index,
  SchemaDetail,
  SchemaList,
} from '@rest-hooks/endpoint';
import {
  Resource,
  RestEndpoint,
  HookableResource,
  FetchGet,
  FetchMutate,
  Schema,
  Entity,
} from '@rest-hooks/rest';
import React, { createContext, useContext } from 'react';

/** Represents data with primary key being from 'id' field. */
export class IDEntity extends Entity {
  readonly id: string | number | undefined = undefined;

  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  pk(parent?: any, key?: string): string | undefined {
    return `${this.id}`;
  }
}

interface Vis {
  readonly id: number | undefined;
  readonly visType: 'graph' | 'line';
  readonly numCols: number;
  readonly updatedAt: number;
}

export class VisSettings extends Resource implements Vis {
  readonly id: number | undefined = undefined;
  readonly visType: 'graph' | 'line' = 'graph' as const;
  readonly numCols: number = 0;
  readonly updatedAt = 0;

  pk() {
    return `${this.id}`;
  }

  static urlRoot = 'http://test.com/vis-settings/';

  static useIncoming(
    existingMeta: { date: number },
    incomingMeta: { date: number },
    existing: any,
    incoming: any,
  ) {
    return existing.updatedAt <= incoming.updatedAt;
  }

  protected static endpointMutate(): RestEndpoint<
    (this: RestEndpoint, params: any, body?: any) => Promise<any>,
    Schema | undefined,
    true
  > {
    const sup = super.endpointMutate();
    return sup.extend({
      getFetchInit(this: RestEndpoint, body?: any) {
        if (body) {
          body = { ...body, updatedAt: Date.now() };
        }
        return sup.getFetchInit.call(this, body);
      },
    });
  }

  static partialUpdate<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    FetchMutate<[{ id: number }, Partial<Exclude<Vis, 'updatedAt'>>]>,
    T,
    true
  > {
    const detail = (this as unknown as typeof VisSettings).detail();
    const partial = super.partialUpdate();
    return partial.extend({
      getOptimisticResponse(snap, params, body) {
        const { data } = snap.getResponse(detail, params);
        if (!data) throw new AbortOptimistic();
        return {
          ...data,
          ...body,
          updatedAt: snap.fetchedAt,
        };
      },
      schema: this,
    });
  }

  static incrementCols<T extends typeof VisSettings>(
    this: T,
  ): RestEndpoint<(id: number) => Promise<any>, T, true> {
    const detail = this.detail();

    return this.endpointMutate().extend({
      name: 'incrementCols',
      url: (id: number) => `${this.urlRoot}{id}/incCol`,
      getOptimisticResponse(snap, id: number) {
        const { data } = snap.getResponse(detail, { id });
        const numCols = data ? data.numCols + 1 : 0;
        return {
          ...data,
          numCols,
          updatedAt: snap.fetchedAt,
        };
      },
      schema: this,
    });
  }
}

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
  static url(urlParams?: any): string {
    if (urlParams && !urlParams.id) {
      return `${this.urlRoot}${urlParams.title}`;
    }
    return super.url(urlParams);
  }

  static longLiving<T extends typeof Resource>(this: T) {
    return this.detail().extend({
      dataExpiryLength: 1000 * 60 * 60,
    });
  }

  static neverRetryOnError<T extends typeof Resource>(this: T) {
    return this.detail().extend({
      errorExpiryLength: Infinity,
    });
  }

  static singleWithUser<T extends typeof ArticleResource>(this: T) {
    return this.detail().extend({
      url: (params: object) => this.url({ ...params, includeUser: true }),
    });
  }

  static listWithUser<T extends typeof ArticleResource>(this: T) {
    return this.list().extend({
      url: (
        params: Readonly<Record<string, string | number | boolean>> | undefined,
      ) => this.listUrl({ ...params, includeUser: true }),
    });
  }

  static partialUpdate<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<FetchMutate, T, true> {
    return super.partialUpdate().extend({
      getOptimisticResponse: (snap, params, body) => ({
        id: params.id,
        ...body,
      }),
      schema: this,
    });
  }

  static delete<T extends typeof Resource>(this: T) {
    return super.delete().extend({
      getOptimisticResponse: (snap, params) => params,
      schema: new schema.Delete(this),
    });
  }
}

export const AuthContext = createContext('');

export class ContextAuthdArticle extends HookableResource {
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
  static url(urlParams?: any): string {
    if (urlParams && !urlParams.id) {
      return `${this.urlRoot}${urlParams.title}`;
    }
    return super.url(urlParams);
  }

  /** Init options for fetch */
  static useFetchInit(init: RequestInit): RequestInit {
    /* eslint-disable-next-line */
    const accessToken = useContext(AuthContext);
    return {
      ...init,
      headers: {
        ...init.headers,
        'Access-Token': accessToken,
      },
    };
  }

  static useListWithUser<T extends typeof ContextAuthdArticle>(this: T) {
    return this.useList().extend({
      url: (
        params: Readonly<Record<string, string | number | boolean>> | undefined,
      ) => this.listUrl({ ...params, includeUser: true }),
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
  static otherList<T extends typeof ArticleResourceWithOtherListUrl>(this: T) {
    return this.list().extend({
      url: () => this.urlRoot + 'some-list-url',
    });
  }

  static create<T extends typeof Resource>(this: T) {
    const list = ArticleResourceWithOtherListUrl.list();
    const otherList = ArticleResourceWithOtherListUrl.otherList();
    return super.create().extend({
      getOptimisticResponse: (snap, body) => body,
      schema: this,
      update: (newArticleID: string) => ({
        [list.key({})]: (articleIDs: string[] | undefined) => [
          ...(articleIDs || []),
          newArticleID,
        ],
        [otherList.key({})]: (articleIDs: string[] | undefined) => [
          ...(articleIDs || []),
          newArticleID,
        ],
      }),
    });
  }
}
/*
        [
          [
            ArticleResourceWithOtherListUrl.list(),
            {},
            (newArticleID: string, articleIDs: string[] | undefined) => [
              ...(articleIDs || []),
              newArticleID,
            ],
          ],
          [
            ArticleResourceWithOtherListUrl.otherList(),
            {},
            (newArticleID: string, articleIDs: string[] | undefined) => [
              ...(articleIDs || []),
              newArticleID,
            ],
          ],
        ],
        */

export class CoolerArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
  }
}

export class EditorArticleResource extends CoolerArticleResource {
  readonly editor: UserResource | null = null;

  static schema = {
    ...ArticleResource.schema,
    editor: UserResource,
  };
}

export class TypedArticleResource extends CoolerArticleResource {
  get tagString() {
    return this.tags.join(', ');
  }

  static update<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    FetchMutate<
      [{ id: number }, Partial<AbstractInstanceType<T>>],
      Partial<AbstractInstanceType<T>>
    >,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return super.update();
  }

  static detail<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    FetchGet<[{ id: number }], Partial<AbstractInstanceType<T>>>,
    SchemaDetail<AbstractInstanceType<T>>,
    undefined
  > {
    return super.detail();
  }

  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    FetchGet<[any], Partial<AbstractInstanceType<T>>[]>,
    SchemaList<AbstractInstanceType<T>>,
    undefined
  > {
    return super.list();
  }

  static anyparam<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<(a: any) => Promise<any>> {
    return super.detail() as any;
  }

  static anybody<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<(a: any, b: any) => Promise<any>> {
    return super.detail() as any;
  }

  static noparams<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<() => Promise<any>, T[], undefined> {
    return super.list() as any;
  }
}

export class FutureArticleResource extends CoolerArticleResource {
  static url(id: any): string {
    if (this.pk({ id }) !== undefined) {
      return `${this.urlRoot.replace(/\/$/, '')}/${this.pk({ id })}`;
    }
    return this.urlRoot;
  }

  static update<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    FetchMutate<
      [{ id: number }, Partial<AbstractInstanceType<T>>],
      Partial<AbstractInstanceType<T>>
    >,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return super.update();
  }

  static create<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (
      body: Partial<AbstractInstanceType<T>>,
    ) => Promise<Partial<AbstractInstanceType<T>>>,
    SchemaDetail<AbstractInstanceType<T>>,
    true,
    Parameters<T['listUrl']>
  > {
    const instanceFetch = this.fetch.bind(this);
    return super.create().extend({
      fetch(body: Partial<AbstractInstanceType<T>>) {
        return instanceFetch(this.url(), this.getFetchInit(body));
      },
      url: () => this.listUrl({}),
      update: (newid: string) => ({
        [this.list().key({})]: (existing: string[] = []) => [
          newid,
          ...existing,
        ],
      }),
    });
  }

  static detail<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (id: number) => Promise<Partial<AbstractInstanceType<T>>>,
    T,
    undefined
  > {
    return super.detail().extend({ schema: this });
  }

  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    (
      options?: Record<string, any>,
    ) => Promise<Partial<AbstractInstanceType<T>>[]>,
    T[],
    undefined
  > {
    return super.list().extend({ schema: [this] });
  }
}

export class CoauthoredArticleResource extends FutureArticleResource {
  readonly coAuthors: UserResource[] = [];
  static schema = {
    ...FutureArticleResource.schema,
    coAuthors: [UserResource],
  };
}

export const CoolerArticleDetail = new Endpoint(
  ({ id }: { id: number }) => {
    return fetch(`http://test.com/article-cooler/${id}`).then(res =>
      res.json(),
    ) as Promise<{
      [k in keyof CoolerArticleResource]: CoolerArticleResource[k];
    }>;
  },
  {
    key({ id }: { id: number }) {
      return `article-cooler ${id}`;
    },
  },
);

export class IndexedUserResource extends UserResource {
  static indexes = ['username' as const];

  static index() {
    return new Index(this);
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

  static pusher<T extends typeof PollingArticleResource>(this: T) {
    return this.detail().extend({
      extra: {
        eventType: 'PollingArticleResource:fetch',
      },
    });
  }

  static anotherDetail<T extends typeof PollingArticleResource>(this: T) {
    return this.detail().extend({
      method: 'GET',
      schema: this,
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

  static list<T extends typeof Resource>(
    this: T,
  ): RestEndpoint<
    FetchFunction,
    { results: T[]; prevPage: string; nextPage: string },
    undefined
  > {
    return super.list().extend({
      schema: { results: [this], prevPage: '', nextPage: '' },
    });
  }

  static listDefaults<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: makePaginatedRecord(this),
    });
  }

  static detail<T extends typeof Resource>(this: T) {
    return super.detail().extend({
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
      schema: new schema.Union(
        {
          first: FirstUnionResource,
          second: SecondUnionResource,
        },
        'type',
      ),
    });
  }

  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: [
        new schema.Union(
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

export const GetPhoto = new Endpoint(
  async function ({ userId }: { userId: string }): Promise<ArrayBuffer> {
    const response = await fetch(this.key({ userId }));
    const photoArrayBuffer = await response.arrayBuffer();
    return photoArrayBuffer;
  },
  {
    key({ userId }: { userId: string }) {
      return `/users/${userId}/photo`;
    },
  },
);

export const GetPhotoUndefined = GetPhoto.extend({
  key({ userId }: { userId: string }) {
    return `/users/${userId}/photo2`;
  },
});
// Currently Endpoint sets schema to null for backwards compat
// However, we explicitly want to test undefined here to support non-backcompat endpoints
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
GetPhotoUndefined.schema = undefined;

export const GetNoEntities = new Endpoint(
  async function ({ userId }: { userId: string }) {
    return await (await fetch(`http://test.com/users/${userId}/simple`)).json();
  },
  {
    key({ userId }: { userId: string }) {
      return `/users/${userId}/simple`;
    },
    schema: { firstThing: '', someItems: [] as { a: number }[] },
  },
);

export const Post = new Endpoint(
  async function ({ userId }: { userId: string }, body: BodyInit) {
    return await (
      await fetch(`http://test.com/users/${userId}/simple`, {
        method: 'POST',
        body,
      })
    ).json();
  },
  {
    key({ userId }: { userId: string }) {
      return `/users/${userId}/simple`;
    },
    schema: { firstThing: '', someItems: [] as { a: number }[] },
  },
);

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
