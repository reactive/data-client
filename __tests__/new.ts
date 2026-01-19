import { Temporal } from '@js-temporal/polyfill';
import React, { createContext, useContext } from 'react';

import {
  Endpoint,
  resource,
  RestEndpoint,
  Schema,
  Entity,
  EntityMixin,
  RestGenerics,
  hookifyResource,
  RestType,
  RestInstance,
  Resource,
  ResourceOptions,
  Union,
  Invalidate,
} from '@data-client/rest';

/** Represents data with primary key being from 'id' field. */
export class IDEntity extends Entity {
  readonly id: string | number | undefined = undefined;
}

class Vis {
  readonly id: number | undefined = undefined;
  readonly visType: 'graph' | 'line' = 'graph';
  readonly numCols: number = 0;
  readonly updatedAt: number = 0;
}

export class VisSettings extends Entity implements Vis {
  readonly id: number | undefined = undefined;
  readonly visType: 'graph' | 'line' = 'graph';
  readonly numCols: number = 0;
  readonly updatedAt: number = 0;

  static shouldUpdate(
    existingMeta: { date: number },
    incomingMeta: { date: number },
    existing: any,
    incoming: any,
  ) {
    return existing.updatedAt <= incoming.updatedAt;
  }

  static key = 'VisSettings';
}
export class VisSettingsFromMixin extends EntityMixin(Vis) {
  static cmpIncoming(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return incoming.updatedAt - existing.updatedAt;
  }

  static key = 'VisSettings';
}
export class VisEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  getRequestInit(body: any) {
    if (body && typeof body === 'object') {
      body = { ...body, updatedAt: Date.now() };
    }
    return super.getRequestInit(body);
  }
}
const VisSettingsResourceBase = resource({
  path: 'http\\://test.com/vis-settings/:id',
  schema: VisSettings,
  Endpoint: VisEndpoint,
});
export const VisSettingsResource = {
  ...VisSettingsResourceBase,
  partialUpdate: VisSettingsResourceBase.partialUpdate.extend({
    getOptimisticResponse(snap, params, body) {
      const { data } = snap.getResponse(VisSettingsResourceBase.get, params);
      if (!data) throw snap.abort;
      return {
        ...data,
        ...body,
        updatedAt: snap.fetchedAt,
      };
    },
  }),
  incrementCols: new VisEndpoint({
    schema: VisSettings,
    path: 'http\\://test.com/vis-settings/:id/incCol',
    body: undefined,
    method: 'POST',
    name: 'incrementCols',
  }).extend({
    getOptimisticResponse(snap, params) {
      const { data } = snap.getResponse(VisSettingsResourceBase.get, params);
      const numCols = data ? data.numCols + 1 : 0;
      return {
        ...data,
        numCols,
        updatedAt: snap.fetchedAt,
      } as any;
    },
  }),
};
const VisSettingsResourceBaseFromMixin = resource({
  path: 'http\\://test.com/vis-settings/:id',
  schema: VisSettingsFromMixin,
  Endpoint: VisEndpoint,
});
export const VisSettingsResourceFromMixin = {
  ...VisSettingsResourceBaseFromMixin,
  partialUpdate: VisSettingsResourceBaseFromMixin.partialUpdate.extend({
    getOptimisticResponse(snap, params, body) {
      const { data } = snap.getResponse(
        VisSettingsResourceBaseFromMixin.get,
        params,
      );
      if (!data) throw snap.abort;
      return {
        ...data,
        ...body,
        updatedAt: snap.fetchedAt,
      };
    },
  }),
  incrementCols: new VisEndpoint({
    schema: VisSettingsFromMixin,
    path: 'http\\://test.com/vis-settings/:id/incCol',
    body: undefined,
    method: 'POST',
    name: 'incrementCols',
  }).extend({
    getOptimisticResponse(snap, params) {
      const { data } = snap.getResponse(
        VisSettingsResourceBaseFromMixin.get,
        params,
      );
      const numCols = data ? data.numCols + 1 : 0;
      return {
        ...data,
        numCols,
        updatedAt: snap.fetchedAt,
      } as any;
    },
  }),
};

export class User extends Entity {
  readonly id: number | undefined = undefined;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;
}
export const UserResource = resource({
  path: 'http\\://test.com/user/:id',
  schema: User,
});

export class Article extends Entity {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: User | null = null;
  readonly tags: string[] = [];

  static schema = {
    author: User,
  };
}

export class ArticleWithSlug extends Article {
  readonly slug: string = '';

  static indexes = ['slug'] as const;
}

class ArticleData {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: User | null = null;
  readonly tags: string[] = [];
}
export class ArticleFromMixin extends EntityMixin(ArticleData, {
  schema: { author: User },
}) {}
class ArticleEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {}

interface ArticleGenerics {
  /** @see https://dataclient.io/rest/api/resource#path */
  readonly path?: string;
  /** @see https://dataclient.io/rest/api/resource#schema */
  readonly schema: Schema;
  /** Only used for types */
  /** @see https://dataclient.io/rest/api/resource#body */
  readonly body?: any;
  /** Only used for types */
  /** @see https://dataclient.io/rest/api/resource#searchParams */
  readonly searchParams?: any;
}
function createArticleResource<O extends ArticleGenerics>({
  schema,
  urlRoot = 'article',
  Endpoint = ArticleEndpoint,
  optimistic,
  ...options
}: Readonly<O> & ResourceOptions & { urlRoot?: string }): Resource<
  O & { path: '/:id' }
> & {
  longLiving: Resource<O & { path: '/:id' }>['get'];
  neverRetryOnError: Resource<O & { path: '/:id' }>['get'];
  singleWithUser: Resource<O & { path: '/:id' }>['get'];
  listWithUser: Resource<O & { path: '/:id' }>['getList'];
} {
  class EndpointUrlRootOverride<
    O extends RestGenerics = any,
  > extends Endpoint<O> {
    urlPrefix = `http://test.com/${urlRoot}`;
  }
  const BaseResource = resource({
    path: '/:id',
    schema,
    Endpoint: EndpointUrlRootOverride,
    optimistic,
    ...options,
  })
    .extend('longLiving', { dataExpiryLength: 1000 * 60 * 60 })
    .extend('neverRetryOnError', { errorExpiryLength: Infinity })
    .extend(Base => ({
      singleWithUser: Base.get.extend({
        url: (...args: any) =>
          (Base.get.url as any)({ ...args[0], includeUser: true }),
      }),
      listWithUser: Base.getList.extend({
        url: () => (Base.getList.url as any)({ includeUser: true }),
      }),
    }));
  if (!optimistic) {
    return (BaseResource as any).extend({
      partialUpdate: {
        getOptimisticResponse: (snap, params, body) => ({
          id: params.id,
          ...body,
        }),
      },
      delete: {
        getOptimisticResponse: (snap, params) => params,
      },
    });
  }
  return BaseResource as any;
}
export const ArticleResource = createArticleResource({ schema: Article });
export const ArticleSlugResource = createArticleResource({
  schema: ArticleWithSlug,
});

export const AuthContext = createContext('');

export const ContextAuthdArticleResourceBase = resource({
  path: 'http\\://test.com/article/:id',
  schema: Article,
});
export const ContextAuthdArticleResource = hookifyResource(
  {
    ...ContextAuthdArticleResourceBase,
    getListWithUser: ContextAuthdArticleResourceBase.getList.extend({
      url: () =>
        (ContextAuthdArticleResourceBase.getList.url as any)({
          includeUser: true,
        }),
    }),
  },
  function useInit(): RequestInit {
    const accessToken = useContext(AuthContext);
    if (!accessToken) return {};
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);

export class ArticleTimed extends Article {
  readonly createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    ...Article.schema,
    createdAt: Temporal.Instant.from,
  };
}
export const ArticleTimedResource = createArticleResource({
  schema: ArticleTimed,
  urlRoot: 'article-time',
});

export class UrlArticle extends Article {
  readonly url: string = 'happy.com';
}
export const UrlArticleResource = createArticleResource({ schema: UrlArticle });

export const ArticleResourceWithOtherListUrl = {
  ...ArticleResource,
  getList: ArticleResource.getList.extend({
    schema: [Article],
  }),
  otherList: ArticleResource.getList.extend({
    url: () => ArticleResource.getList.url() + 'some-list-url',
    schema: [Article],
  }),
  create: ArticleResource.create
    .extend({
      schema: Article,
    })
    .extend({
      getOptimisticResponse: (snap, body) => body,
      update: newArticleID => ({
        [ArticleResource.getList.key()]: (articleIDs: string[] | undefined) => [
          ...(articleIDs || []),
          newArticleID,
        ],
        [ArticleResource.getList.key() + 'some-list-url']: (
          articleIDs: string[] | undefined,
        ) => [...(articleIDs || []), newArticleID],
      }),
    }),
};

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

export class CoolerArticle extends Article {
  get things() {
    return `${this.title} five`;
  }
}
const CoolerArticleResourceBase = createArticleResource({
  schema: CoolerArticle,
  urlRoot: 'article-cooler',
});
export const CoolerArticleResource = {
  ...CoolerArticleResourceBase,
  get: CoolerArticleResourceBase.get.extend({
    path: '/:id?/:title?',
  }),
};
export const OptimisticArticleResource = createArticleResource({
  schema: CoolerArticle,
  urlRoot: 'article-cooler',
  optimistic: true,
}).extend('get', { path: '/:id?/:title?' });

const CoolerArticleResourceFromMixinBase = createArticleResource({
  schema: ArticleFromMixin,
  urlRoot: 'article-cooler',
});
export const CoolerArticleResourceFromMixin = {
  ...CoolerArticleResourceFromMixinBase,
  get: CoolerArticleResourceFromMixinBase.get.extend({
    path: '/:id?/:title?',
  }),
};

export class EditorArticle extends CoolerArticle {
  readonly editor: User | null = null;

  static schema = {
    ...Article.schema,
    editor: User,
  };

  static key = 'CoolerArticle';
}
export const EditorArticleResource = createArticleResource({
  schema: EditorArticle,
  urlRoot: 'article-cooler',
});

export class TypedArticle extends CoolerArticle {
  get tagString() {
    return this.tags.join(', ');
  }
}
export const TypedArticleResourceBase = createArticleResource({
  schema: TypedArticle,
  urlRoot: 'article-cooler',
});
export const TypedArticleResource = {
  ...TypedArticleResourceBase,
  anyparam: TypedArticleResourceBase.get.extend({
    path: '/:id',
  }),
  anybody: TypedArticleResourceBase.get.extend({
    path: '/:id',
    method: 'POST',
    body: 0 as any,
  }),
  noparams: TypedArticleResourceBase.getList,
};

/** Validating more exotic argument types */
export const FutureArticleResource = {
  ...CoolerArticleResource,
  get: (
    CoolerArticleResource.get as any as RestInstance<
      (id: string | number) => any,
      typeof CoolerArticle,
      undefined
    >
  ).extend({
    url(id: string) {
      return `http://test.com/article-cooler/${id}`;
    },
  }),
  update: (
    CoolerArticleResource.update as any as RestInstance<
      (id: string | number, body: Partial<CoolerArticle>) => any,
      typeof CoolerArticle,
      true
    >
  ).extend({
    url(id: string, body) {
      return `http://test.com/article-cooler/${id}`;
    },
  }),
  delete: (
    CoolerArticleResource.delete as any as RestType<
      string | number,
      undefined,
      Invalidate<typeof CoolerArticle>,
      true
    >
  ).extend({
    url(id: string) {
      return `http://test.com/article-cooler/${id}`;
    },
    process(res: any, id: string) {
      return res && Object.keys(res).length ? res : { id };
    },
    getOptimisticResponse: undefined,
  }),
  create: CoolerArticleResource.create.extend({
    path: '',
    body: {} as {
      id?: number;
      title?: string;
      content?: string;
      tags?: string[];
    },
    process(value: any): {
      id: number;
      title: string;
      content: string;
      tags: string[];
    } {
      return value;
    },
  }),
};

export class CoauthoredArticle extends CoolerArticle {
  readonly coAuthors: User[] = [];
  static schema = {
    ...CoolerArticle.schema,
    coAuthors: [User],
  };
}
export const CoauthoredArticleResource = createArticleResource({
  schema: CoauthoredArticle,
  urlRoot: 'article-cooler',
});

export const CoolerArticleDetail = new Endpoint(
  ({ id }: { id: number }) => {
    return fetch(`http://test.com/article-cooler/${id}`).then(res =>
      res.json(),
    ) as Promise<{
      [k in keyof CoolerArticle]: CoolerArticle[k];
    }>;
  },
  {
    key({ id }: { id: number }) {
      return `article-cooler ${id}`;
    },
  },
);

export class IndexedUser extends User {
  static readonly indexes = ['username'];
}
export const IndexedUserResource = resource({
  path: 'http\\://test.com/user/:id',
  schema: IndexedUser,
});

class InvalidIfStaleEndpoint<
  O extends RestGenerics = any,
> extends ArticleEndpoint<O> {
  dataExpiryLength = 5000;
  errorExpiryLength = 5000;
  invalidIfStale = true;
}
export const InvalidIfStaleArticleResource = createArticleResource({
  schema: CoolerArticle,
  urlRoot: 'article-cooler',
  Endpoint: InvalidIfStaleEndpoint,
});

class PollingEndpoint<O extends RestGenerics = any> extends ArticleEndpoint<O> {
  pollFrequency = 5000;
  dataExpiryLength = 5000;
}
export const PollingArticleResourceBase = createArticleResource({
  schema: Article,
  urlRoot: 'article',
  Endpoint: PollingEndpoint,
});
export const PollingArticleResource = {
  ...PollingArticleResourceBase,
  pusher: PollingArticleResourceBase.get.extend({
    extra: { eventType: 'PollingArticleResource:fetch' },
  }),
  anotherGet: PollingArticleResourceBase.get.extend({
    method: 'GET',
    schema: Article,
  }),
};

class StaticEndpoint<O extends RestGenerics = any> extends ArticleEndpoint<O> {
  dataExpiryLength = Infinity;
}
export const StaticArticleResource = createArticleResource({
  schema: Article,
  urlRoot: 'article-static',
  Endpoint: StaticEndpoint,
});

abstract class OtherArticle extends CoolerArticle {}

export class PaginatedArticle extends OtherArticle {}

function makePaginatedRecord<T>(entity: T) {
  return { prevPage: '', nextPage: '', results: [entity] };
}

const PaginatedArticleResourceBase = createArticleResource({
  schema: PaginatedArticle,
  urlRoot: 'article-paginated',
  Endpoint: StaticEndpoint,
});
const paginatedSchema = {
  results: [PaginatedArticle],
  prevPage: '',
  nextPage: '',
};
export const PaginatedArticleResource = {
  ...PaginatedArticleResourceBase,
  getList: PaginatedArticleResourceBase.getList.extend({
    schema: paginatedSchema,
    searchParams: {} as
      | undefined
      | { cursor?: string | number; admin?: boolean },
  }),
  getListDefaults: PaginatedArticleResourceBase.getList.extend({
    schema: makePaginatedRecord(PaginatedArticle),
  }),
  get: PaginatedArticleResourceBase.get.extend({
    schema: { data: PaginatedArticle },
  }),
};

export const ListPaginatedArticle = new Endpoint(
  () => {
    return PaginatedArticleResource.getList();
  },
  {
    schema: makePaginatedRecord(PaginatedArticle),
  },
);

export abstract class UnionBase extends Entity {
  readonly id: string = '';
  readonly body: string = '';
  readonly type: string = '';
}
export class FirstUnion extends UnionBase {
  readonly type = 'first';
  readonly firstOnlyField: number = 5;
}
export class SecondUnion extends UnionBase {
  readonly type = 'second';
  readonly secondeOnlyField: number = 10;
}

export const UnionSchema = new Union(
  {
    first: FirstUnion,
    second: SecondUnion,
  },
  'type',
);
const UnionResourceBase = resource({
  path: '/union/:id',
  schema: UnionSchema,
});
export const UnionResource = {
  ...UnionResourceBase,
  // just to test the other type of union def
  getList: UnionResourceBase.getList.extend({
    schema: [
      new Union(
        {
          first: FirstUnion,
          second: SecondUnion,
        },
        (input: FirstUnion | SecondUnion) => input['type'],
      ),
    ],
  }),
};

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
    testKey(key: string) {
      return /\/users\/([\w\W]+)\/photo/.test(key);
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
