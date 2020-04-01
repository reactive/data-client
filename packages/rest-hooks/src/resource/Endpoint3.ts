import {
  CoolerArticleResource,
  ArticleResource,
  PaginatedArticleResource,
  UserResource,
  ArticleResourceWithOtherListUrl,
} from '__tests__/common';

import { Schema } from './normal';

interface EndpointCommon<Params extends Readonly<object> = Readonly<object>> {
  getKey(params: Params): string;
  readonly type: 'read' | 'mutate' | 'delete';
  readonly schema?: Schema;
}

interface EndpointInterface<
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined,
  Return = any
> extends EndpointCommon<Params> {
  (params: Params, body: Body): Promise<Return>;
}

interface EndpointProps<
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined,
  Return = any
> extends EndpointCommon<Params> {
  fetch: (params: Params, body: Body) => Promise<Return>;
}

class Endpoint<
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined,
  Return = any
> extends Function {
  constructor(props: EndpointProps<Params, Body, Return>) {
    super('return arguments.callee.fetch.apply(arguments.callee, arguments)');
    Object.assign(this, props);
  }

  getKey(params: Params) {
    return `${this.constructor.name} ${JSON.stringify(params)}`;
  }

  readonly type: 'read' | 'mutate' | 'delete' = 'read';

  readonly schema: S;

  fetch: (params: Params, body: Body) => Promise<any>;
}

const fetchUser = new Endpoint({
  schema: UserResource,
  fetch(params: { id: number }) {
    return fetch('GET', `/user/${id}`);
  },
  type: 'read',
});

fetchUser(5);
