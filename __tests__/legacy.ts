import {
  MutateShape,
  Resource,
  Delete,
  ReadShape,
  SchemaDetail,
  SchemaList,
  DeleteShape,
} from '@rest-hooks/legacy';
import type { AbstractInstanceType } from '@rest-hooks/normalizr';

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
  static url(urlParams?: any): string {
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
  ): DeleteShape<Delete<T>, Readonly<object>> {
    return {
      ...(super.deleteShape() as any),
      options: {
        ...this.getEndpointExtra(),
        optimisticUpdate: (params: any) => params,
      },
    };
  }
}

export class CoolerArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
  }

  static deleteShape<T extends typeof Resource>(
    this: T,
  ): MutateShape<Delete<T>, Readonly<object>, unknown> {
    return super.deleteShape() as any;
  }
}

export class UrlArticleResource extends ArticleResource {
  readonly url: string = 'happy.com';
}
