// Type-level regression tests for the params passed to process() in RestEndpoint.extend().
// Each @ts-expect-error line must keep erroring; plain lines must keep compiling.
import { Entity, RestEndpoint, resource } from '@data-client/rest';

const get = new RestEndpoint({ path: '/users/:id' });

export const child = get.extend({
  process(value, params) {
    // @ts-expect-error id is string | number
    return params.id.toFixed();
  },
});
child({ id: 'bob' });

export const ok = get.extend({
  process(value, params) {
    const s: string | number = params.id;
    return s;
  },
});

export const annotated = get.extend({
  process(value: any, params: { id: string }) {
    return params.id;
  },
});

export const chained = get.extend({ path: '/u/:uid' }).extend({
  process(value, params) {
    const s: string | number = params.uid;
    // @ts-expect-error not a param
    params.id;
    return s;
  },
});

export const samecall = get.extend({
  path: '/x/:xid',
  process(value, params) {
    const s: string | number = params.xid;
    // @ts-expect-error old path param is gone
    params.id;
    return s;
  },
});

export const withSearch = new RestEndpoint({
  path: '/users',
  searchParams: {} as { page?: number },
}).extend({
  process(value, params) {
    const p: number | undefined = params?.page;
    // @ts-expect-error page is a number
    params?.page?.toUpperCase();
    return p;
  },
});

export const post = new RestEndpoint({
  path: '/users/:id',
  method: 'POST',
}).extend({
  process(value, params, body) {
    // @ts-expect-error id is string | number
    params.id.toFixed();
    return [params.id, body];
  },
});

// optional searchParams with a body: called as ep(body) or ep(params, body)
export const postSearch = new RestEndpoint({
  path: '/users',
  method: 'POST',
  searchParams: {} as { page?: number },
  body: {} as { name: string },
}).extend({
  process(value, params, body) {
    // params is the body when called as ep(body)
    const p: { page?: number } | { name: string } = params;
    const b: { name: string } | undefined = body;
    // @ts-expect-error page may be missing
    params.page;
    return [p, b];
  },
});

class User extends Entity {
  id = '';
  static key = 'User';
}
const UserResource = resource({ path: '/users/:id', schema: User });

export const ExtendedUser = UserResource.extend('get', {
  process(value, params) {
    const s: string | number = params.id;
    // @ts-expect-error id is string | number
    params.id.toFixed();
    return [value, s];
  },
}).extend('byName', {
  path: '/users/name/:name',
  process(value, params) {
    const s: string | number = params.name;
    // @ts-expect-error not a param of byName
    params.id;
    return [value, s];
  },
});

// custom fetch with an optional (defaulted) params argument
class PageEndpoint extends RestEndpoint<{
  path: '/users';
  searchParams: { page?: number };
}> {
  fetch = async (params: { page?: number } = {}) => this.process([], params);
}
const pageEp = new PageEndpoint({
  path: '/users',
  searchParams: {} as { page?: number },
});
export const pageChild = pageEp.extend({
  process(value, params) {
    // @ts-expect-error page is a number
    params?.page?.toUpperCase();
    return params?.page ?? value;
  },
});
pageChild();
pageChild({ page: 2 });

// custom fetch with an optional body argument
class OptionalBodyEndpoint extends RestEndpoint<{
  path: '/users/:id';
  method: 'POST';
  body: { name: string };
}> {
  fetch = async (params: { id: string | number }, body?: { name: string }) =>
    this.process([], params, body!);
}
export const optionalBodyChild = new OptionalBodyEndpoint({
  path: '/users/:id',
  method: 'POST',
  body: {} as { name: string },
}).extend({
  process(value, params, body) {
    const id: string | number = params.id;
    const name: string | undefined = body?.name;
    // @ts-expect-error body may be undefined
    body.name;
    return [id, name];
  },
});

// a single custom fetch signature is kept as is, including a third argument
class ExtraArgEndpoint extends RestEndpoint<{ path: '/users/:id' }> {
  fetch = async (
    params: { id: string | number },
    body?: undefined,
    extra?: number,
  ) => this.process([], params);
}
export const extraArgChild = new ExtraArgEndpoint({
  path: '/users/:id',
}).extend({
  process(value, params, body, extra) {
    const e: number | undefined = extra;
    // @ts-expect-error extra may be undefined
    extra.toFixed();
    return [params.id, e];
  },
});
