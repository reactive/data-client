import React from 'react';
import { Schema, schema } from 'normalizr';
import { Resource } from '../resource';
import * as selectors from '../state/selectors';

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

export class PaginatedArticleResource extends CoolerArticleResource {
  static listRequest<T extends typeof Resource>(this: T) {
    return {
      ...super.listRequest(),
      schema: { results: [super.getSchema()] },
      select: selectors.makeList(this, results => results.results),
    };
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
