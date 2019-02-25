import React from 'react';
import { Resource, SchemaArray, schemas } from '../resource';
import { makeSchemaSelector } from '../state/selectors';
import { AbstractInstanceType } from '../types';
import { useSelect } from '../react-integration/hooks'

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
}

export class CoolerArticleResource extends ArticleResource {
  static urlRoot = 'http://test.com/article-cooler/';
  get things() {
    return `${this.title} five`;
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
class OtherArticleResource extends CoolerArticleResource {

}
export class PaginatedArticleResource extends OtherArticleResource {
  static listRequest<T extends typeof Resource>(this: T) {
    const req = super.listRequest();
    const schema: SchemaArray<AbstractInstanceType<T>> = { results: [this.getEntitySchema()] };
    return {
      ...req,
      schema,
      select: makeSchemaSelector({ schema, getUrl: req.getUrl }, results => results.results),
    };
  }
}

export class NestedArticleResource extends OtherArticleResource {
  readonly user: number | null = null;

  static getEntitySchema<T extends typeof Resource>(this: T): schemas.Entity<AbstractInstanceType<T>> {
    const schema = super.getEntitySchema();
    schema.define({
      user: UserResource.getEntitySchema(),
    })
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
