import {
  CoolerArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  UserResource,
  ArticleResourceWithOtherListUrl,
} from '__tests__/common';

import { Schema } from './normal';

abstract class Endpoint {
  private readonly params: Readonly<object | string> | void;
  private readonly body: Readonly<object | string> | void;

  constructor(
    params: Readonly<object | string> | void,
    body?: Readonly<object | string> | void,
  ) {
    this.params = params;
    this.body = body;
  }

  get key() {
    return `${this.constructor.name} ${JSON.stringify(this.params)}`;
  }

  abstract readonly type: 'read' | 'mutate' | 'delete';

  abstract readonly schema: Schema;

  abstract then(): any;
}

abstract class ReadEndpoint extends Endpoint {
  readonly type = 'read';
}

class GetUser extends ReadEndpoint {
  readonly schema = UserResource;

  constructor(params: { id: number }) {
    super(params);
    fetch('get', `/user/${id}`);
  }
}

new GetUser({ id: 5 });
// useResource(GetUser, { id: 5 });
