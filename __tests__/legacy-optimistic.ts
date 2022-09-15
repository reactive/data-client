import { AbstractInstanceType, schema } from '@rest-hooks/endpoint';
import { SchemaDetail, SchemaList } from '@rest-hooks/endpoint';
import { rest3 } from '@rest-hooks/legacy';

export class UserResource extends rest3.Resource {
  readonly id: number | undefined = undefined;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/user/';
}
export class ArticleResource extends rest3.Resource {
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

  static longLiving<T extends typeof rest3.Resource>(this: T) {
    return this.detail().extend({
      dataExpiryLength: 1000 * 60 * 60,
    });
  }

  static neverRetryOnError<T extends typeof rest3.Resource>(this: T) {
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

  static partialUpdate<T extends typeof rest3.Resource>(
    this: T,
  ): rest3.RestEndpoint<rest3.FetchMutate, T, true> {
    return super.partialUpdate().extend({
      optimisticUpdate: (params: any, body: any) => ({
        id: params.id,
        ...body,
      }),
      schema: this,
    });
  }

  static delete<T extends typeof rest3.Resource>(this: T) {
    return super.delete().extend({
      optimisticUpdate: (params: any) => params,
      schema: new schema.Delete(this),
    });
  }
}

export class ArticleResourceWithOtherListUrl extends ArticleResource {
  static otherList<T extends typeof ArticleResourceWithOtherListUrl>(this: T) {
    return this.list().extend({
      url: () => this.urlRoot + 'some-list-url',
    });
  }

  static create<T extends typeof rest3.Resource>(this: T) {
    return super.create().extend({
      optimisticUpdate: (
        params: Readonly<object>,
        body: Readonly<object | string> | void,
      ) => body,
      schema: this,
    });
  }
}

export class CoolerArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
  }
}

export class FutureArticleResource extends CoolerArticleResource {
  static url(id: any): string {
    if (this.pk({ id }) !== undefined) {
      return `${this.urlRoot.replace(/\/$/, '')}/${this.pk({ id })}`;
    }
    return this.urlRoot;
  }

  static update<T extends typeof rest3.Resource>(
    this: T,
  ): rest3.RestEndpoint<
    rest3.FetchMutate<
      [{ id: number }, Partial<AbstractInstanceType<T>>],
      Partial<AbstractInstanceType<T>>
    >,
    SchemaDetail<AbstractInstanceType<T>>,
    true
  > {
    return super.update();
  }

  static create<T extends typeof rest3.Resource>(
    this: T,
  ): rest3.RestEndpoint<
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

  static detail<T extends typeof rest3.Resource>(
    this: T,
  ): rest3.RestEndpoint<
    (id: number) => Promise<Partial<AbstractInstanceType<T>>>,
    T,
    undefined
  > {
    return super.detail().extend({ schema: this });
  }

  /*static list<T extends typeof rest3.Resource>(
    this: T,
  ): rest3.RestEndpoint<
    (
      options?: Record<string, any>,
    ) => Promise<Partial<AbstractInstanceType<T>>[]>,
    T[],
    undefined
  > {
    return super.detail().extend({ schema: [this] });
  } - once useResource() takes variable params*/
}
