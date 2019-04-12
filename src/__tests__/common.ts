import React from 'react';
import {
  Resource,
  SchemaArray,
  schemas,
  ReadShape,
  SchemaBase,
} from '../resource';
import { AbstractInstanceType, RequestOptions } from '../types';

export class ArticleResource extends Resource {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id;
  }

  static urlRoot = 'http://test.com/article/';
  static url<T extends typeof Resource>(this: T, urlParams?: any): string {
    if (urlParams && !urlParams.id) {
      return `${this.urlRoot}${urlParams.title}`;
    }
    return super.url(urlParams);
  }

  /** Get the entity schema defining  */
  static getNestedEntitySchema<T extends typeof Resource>(this: T) {
    const baseSchema = this.getEntitySchema();
    baseSchema.define({
      author: UserResource.getEntitySchema(),
    });
    return baseSchema;
  }

  static longLivingRequest<T extends typeof Resource>(this: T) {
    const single = this.singleRequest();
    return {
      ...single,
      options: {
        ...single.options,
        dataExpiryLength: 1000 * 60 * 60,
      },
    };
  }

  static neverRetryOnErrorRequest<T extends typeof Resource>(this: T) {
    const single = this.singleRequest();
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
  ): ReadShape<SchemaBase<AbstractInstanceType<T>>> {
    const baseShape = this.singleRequest();
    return {
      ...baseShape,
      getUrl: (params: Readonly<Record<string, string>>) =>
        baseShape.getUrl({ ...params, includeUser: true }),
      schema: this.getNestedEntitySchema(),
    };
  }

  static listWithUserRequest<T extends typeof ArticleResource>(
    this: T,
  ): ReadShape<SchemaArray<AbstractInstanceType<T>>> {
    const baseShape = this.listRequest();
    return {
      ...baseShape,
      getUrl: (params: Readonly<Record<string, string>>) =>
        baseShape.getUrl({ ...params, includeUser: true }),
      schema: [this.getNestedEntitySchema()],
    };
  }
}

export class CoolerArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
  }
}

export class PollingArticleResource extends ArticleResource {
  static getRequestOptions(): RequestOptions {
    return {
      ...super.getRequestOptions(),
      pollFrequency: 5000,
    };
  }
}

export class StaticArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-static/';

  static getRequestOptions() {
    return {
      ...super.getRequestOptions(),
      dataExpiryLength: Infinity,
    };
  }
}

export class UserResource extends Resource {
  readonly id: number | null = null;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;

  pk() {
    return this.id;
  }
  static urlRoot = 'http://test.com/user/';
}
class OtherArticleResource extends CoolerArticleResource {}
export class PaginatedArticleResource extends OtherArticleResource {
  static urlRoot = 'http://test.com/article-paginated/';
  static listRequest<T extends typeof Resource>(
    this: T,
  ): ReadShape<
    SchemaArray<AbstractInstanceType<T>>,
    Readonly<object>,
    Readonly<object>
  > {
    return {
      ...super.listRequest(),
      schema: { results: [this.getEntitySchema()] },
    };
  }

  static singleRequest<T extends typeof Resource>(
    this: T,
  ): ReadShape<
    SchemaBase<AbstractInstanceType<T>>,
    Readonly<object>,
    Readonly<object>
  > {
    return {
      ...super.listRequest(),
      schema: { data: this.getEntitySchema() },
    };
  }
}

export class NestedArticleResource extends OtherArticleResource {
  readonly user: number | null = null;

  static getEntitySchema<T extends typeof Resource>(
    this: T,
  ): schemas.Entity<AbstractInstanceType<T>> {
    const schema = super.getEntitySchema();
    schema.define({
      user: UserResource.getEntitySchema(),
    });
    return schema as any;
  }
}

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
