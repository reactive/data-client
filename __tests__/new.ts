import { SimpleRecord } from '@rest-hooks/legacy';
import React, { createContext, useContext } from 'react';
import {
  AbstractInstanceType,
  schema,
  AbortOptimistic,
  Endpoint,
  Index,
  createResource,
  RestEndpoint,
  Schema,
  Entity,
  RestGenerics,
  GetEndpoint,
  hookifyResource,
  RestType,
  MutateEndpoint,
} from '@rest-hooks/rest';

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

export class VisSettings extends Entity implements Vis {
  readonly id: number | undefined = undefined;
  readonly visType: 'graph' | 'line' = 'graph';
  readonly numCols: number = 0;
  readonly updatedAt: number = 0;

  pk() {
    return `${this.id}`;
  }

  static useIncoming(
    existingMeta: { date: number },
    incomingMeta: { date: number },
    existing: any,
    incoming: any,
  ) {
    return existing.updatedAt <= incoming.updatedAt;
  }
}
export class VisEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  getRequestInit(body: any): RequestInit {
    if (body && typeof body === 'object') {
      body = { ...body, updatedAt: Date.now() };
    }
    return super.getRequestInit(body);
  }
}
const VisSettingsResourceBase = createResource({
  path: 'http\\://test.com/vis-settings/:id',
  schema: VisSettings,
  Endpoint: VisEndpoint,
});
export const VisSettingsResource = {
  ...VisSettingsResourceBase,
  partialUpdate: VisSettingsResourceBase.partialUpdate.extend({
    getOptimisticResponse(snap, params, body) {
      const { data } = snap.getResponse(VisSettingsResourceBase.get, params);
      if (!data) throw new AbortOptimistic();
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
VisSettingsResource.incrementCols;

export class User extends Entity {
  readonly id: number | undefined = undefined;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;

  pk() {
    return this.id?.toString();
  }
}
export const UserResource = createResource({
  path: 'http\\://test.com/user/:id',
  schema: User,
});

export class Article extends Entity {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: User | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static schema = {
    author: User,
  };
}
class ArticleEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {}

function createArticleResource<S extends Schema>(
  schema: S,
  urlRoot = 'article',
  EndpointArg: typeof ArticleEndpoint = ArticleEndpoint,
) {
  class EndpointUrlRootOverride<
    O extends RestGenerics = any,
  > extends EndpointArg<O> {
    urlPrefix = `http://test.com/${urlRoot}`;
  }
  const base = createResource({
    path: '/:id',
    schema,
    Endpoint: EndpointUrlRootOverride,
  });
  return {
    ...base,
    longLiving: base.get.extend({
      dataExpiryLength: 1000 * 60 * 60,
    }),
    neverRetryOnError: base.get.extend({
      errorExpiryLength: Infinity,
    }),
    singleWithUser: base.get.extend({
      url: (params: any) =>
        (base.get.url as any)({ ...params, includeUser: true }),
    }),
    listWithUser: base.getList.extend({
      url: () => (base.getList.url as any)({ includeUser: true }),
    }),
    partialUpdate: base.partialUpdate.extend({
      getOptimisticResponse: (snap, params, body) => ({
        id: params.id,
        ...body,
      }),
    }) as any as typeof base.partialUpdate,
    delete: base.delete.extend({
      getOptimisticResponse: (snap, params) => params,
    }),
  };
}
export const ArticleResource = createArticleResource(Article);

export const AuthContext = createContext('');

const ContextAuthdArticleResourceBase = createResource({
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
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);

export class ArticleTimed extends Article {
  readonly createdAt = new Date(0);

  static schema = {
    ...Article.schema,
    createdAt: Date,
  };
}
export const ArticleTimedResource = createArticleResource(
  ArticleTimed,
  'article-time',
);

export class UrlArticle extends Article {
  readonly url: string = 'happy.com';
}
export const UrlArticleResource = createArticleResource(UrlArticle);

export const ArticleResourceWithOtherListUrl = {
  ...ArticleResource,
  otherList: ArticleResource.getList.extend({
    url: () => ArticleResource.getList.url() + 'some-list-url',
  }),
  create: ArticleResource.create.extend({
    getOptimisticResponse: (snap, body) => body,
    update: (newArticleID: string) => ({
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
const CoolerArticleResourceBase = createArticleResource(
  CoolerArticle,
  'article-cooler',
);
export const CoolerArticleResource = {
  ...CoolerArticleResourceBase,
  get: CoolerArticleResourceBase.get.extend({
    path: '/:id?/:title?',
  }) as any as GetEndpoint<
    { id: string | number } | { title: string | number },
    typeof CoolerArticle
  >,
};

export class EditorArticle extends CoolerArticle {
  readonly editor: User | null = null;

  static schema = {
    ...Article.schema,
    editor: User,
  };

  static get key() {
    return 'CoolerArticle';
  }
}
export const EditorArticleResource = createArticleResource(
  EditorArticle,
  'article-cooler',
);

export class TypedArticle extends CoolerArticle {
  get tagString() {
    return this.tags.join(', ');
  }
}
export const TypedArticleResourceBase = createArticleResource(
  TypedArticle,
  'article-cooler',
);
export const TypedArticleResource = {
  ...TypedArticleResourceBase,
  anyparam: TypedArticleResourceBase.get.extend({
    path: '/:id',
  }),
  anybody: TypedArticleResourceBase.get.extend({
    path: '/:id',
    body: 0 as any,
  }),
  noparams: TypedArticleResourceBase.getList,
};

/** Validating more exotic argument types */
export const FutureArticleResource = {
  ...CoolerArticleResource,
  get: (
    CoolerArticleResource.get as any as GetEndpoint<
      string | number,
      typeof CoolerArticle
    >
  ).extend({
    url(id: string) {
      return `http://test.com/article-cooler/${id}`;
    },
  }),
  update: (
    CoolerArticleResource.update as any as MutateEndpoint<
      string | number,
      Partial<CoolerArticle>,
      CoolerArticle
    >
  ).extend({
    url(id: string) {
      return `http://test.com/article-cooler/${id}`;
    },
  }),
  delete: (
    CoolerArticleResource.delete as any as RestType<
      string | number,
      undefined,
      schema.Delete<typeof CoolerArticle>,
      true
    >
  ).extend({
    url(id: string) {
      return `http://test.com/article-cooler/${id}`;
    },
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
    update: (newid: string) => ({
      [CoolerArticleResource.getList.key()]: (existing: string[] = []) => [
        newid,
        ...existing,
      ],
    }),
  }),
};

export class CoauthoredArticle extends CoolerArticle {
  readonly coAuthors: User[] = [];
  static schema = {
    ...CoolerArticle.schema,
    coAuthors: [User],
  };
}
export const CoauthoredArticleResource = createArticleResource(
  CoauthoredArticle,
  'article-cooler',
);

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
export const IndexedUserResource = {
  ...createResource({
    path: 'http\\://test.com/user/:id',
    schema: IndexedUser,
  }),
  getIndex: new Index(IndexedUser),
};

class InvalidIfStaleEndpoint<
  O extends RestGenerics = any,
> extends ArticleEndpoint<O> {
  dataExpiryLength = 5000;
  errorExpiryLength = 5000;
  invalidIfStale = true;
}
export const InvalidIfStaleArticleResource = createArticleResource(
  CoolerArticle,
  'article-cooler',
  InvalidIfStaleEndpoint,
);

class PollingEndpoint<O extends RestGenerics = any> extends ArticleEndpoint<O> {
  pollFrequency = 5000;
}
export const PollingArticleResourceBase = createArticleResource(
  Article,
  'article',
  PollingEndpoint,
);
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
export const StaticArticleResource = createArticleResource(
  Article,
  'article-static',
  StaticEndpoint,
);

abstract class OtherArticle extends CoolerArticle {}

export class PaginatedArticle extends OtherArticle {}

function makePaginatedRecord<T>(entity: T) {
  return class PaginatedRecord extends SimpleRecord {
    readonly prevPage = '';
    readonly nextPage = '';
    readonly results: AbstractInstanceType<T>[] = [];
    static schema = { results: [entity] };
  };
}

const PaginatedArticleResourceBase = createArticleResource(
  PaginatedArticle,
  'article-paginated',
);
const paginatedSchema = {
  results: [PaginatedArticle],
  prevPage: '',
  nextPage: '',
};
export const PaginatedArticleResource = {
  ...PaginatedArticleResourceBase,
  getList: PaginatedArticleResourceBase.getList.extend({
    schema: paginatedSchema,
  }) as GetEndpoint<
    undefined | { cursor?: string | number; admin?: boolean },
    typeof paginatedSchema
  >,
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

  pk() {
    return this.id;
  }
}
export class FirstUnion extends UnionBase {
  readonly type = 'first';
  readonly firstOnlyField: number = 5;
}
export class SecondUnion extends UnionBase {
  readonly type = 'second';
  readonly secondeOnlyField: number = 10;
}

const UnionSchema = new schema.Union(
  {
    first: FirstUnion,
    second: SecondUnion,
  },
  'type',
);
const UnionResourceBase = createResource({
  path: '/union/:id',
  schema: UnionSchema,
});
export const UnionResource = {
  ...UnionResourceBase,
  // just to test the other type of union def
  getList: UnionResourceBase.getList.extend({
    schema: [
      new schema.Union(
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
