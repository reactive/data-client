import { Schema } from './normal';

abstract class Endpoint<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined
> extends Function {
  constructor() {
    super('return arguments.callee.fetch.apply(arguments.callee, arguments)');
  }

  getKey(params: Params) {
    return `${this.constructor.name} ${JSON.stringify(params)}`;
  }

  readonly type: 'read' | 'mutate' | 'delete' = 'read';

  abstract readonly schema: S;

  abstract fetch(params: Params, body: Body): Promise<any>;
}

abstract class ReadEndpoint<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined
> extends Endpoint<S, Params, Body> {
  type = 'read' as const;
}

abstract class RESTEndpoint extends Endpoint {
  constructor(resource: SimpleResource) {
    super();
    this.resource = resource;
  }

  resource: SimpleResource;
  abstract method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  abstract url(params: readonly object): string;
  fetch(params: Params, body: Body) {
    return fetch(this.method, this.url(params));
  }
}

function detailUrl(C: typeof RESTEndpoint) {
  return class extends C {
    url(params: Params) {
      return `${this.urlRoot}/${this.resource.pk(params)}`;
    }
  };
}

class ListUrl {
  url(searchParams: Readonly<Record<string, string | number>> = {}): string {
    if (Object.keys(searchParams).length) {
      return `${this.urlRoot}?${paramsToString(searchParams)}`;
    }
    return this.urlRoot;
  }
}

class UserEntity extends Entity {
  readonly username: string = '';
  pk() {
    return this.username;
  }
}

abstract class UserEndpoint extends RESTEndpoint {
  urlRoot = '/user';
  resource = UserEntity;
}

class DetailUser extends detailUrl(UserResource) {
  readonly method = 'get';
}
class UpdateUser extends detailUrl(UserResource) {
  readonly method = 'put';
}
class Resource {
  static Endpoint = class extends RESTEndpoint {};
}

class UserResource {
  static Endpoint = class extends RESTEndpoint {
    urlRoot = '/user';
  };

  static detail() {
    return new DetailUser(this);
  }

  static update = new UpdateUser();
}
