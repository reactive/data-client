// Type-level regression tests for adding to a Collection (push, unshift, resource().create):
// a list body resolves a list, a single body resolves one item.
// Each @ts-expect-error line must keep erroring; plain lines must keep compiling.
import {
  Controller,
  type EndpointInterface,
  type EndpointUpdateFunction,
} from '@data-client/core';

import {
  Collection,
  Entity,
  RestEndpoint,
  resource,
  type Denormalize,
  type DenormalizeNullable,
  type Normalize,
} from '@data-client/rest';

class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
}
const TodoResource = resource({
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Todo,
});
const ctrl = new Controller();

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true
  : false;
/** Compiles only when value's type is exactly T */
function expectType<T>() {
  return <V>(value: V, _exact: Equals<T, V>) => value;
}

export async function listBody() {
  const pushed = await ctrl.fetch(TodoResource.getList.push, [
    { title: 'a' },
    { title: 'b' },
  ]);
  expectType<Todo[]>()(pushed, true);

  const unshifted = await ctrl.fetch(TodoResource.getList.unshift, [
    { title: 'a' },
  ]);
  expectType<Todo[]>()(unshifted, true);
  // create (deprecated) keeps resolving one item; getList.push is its typed replacement
  const created = await ctrl.fetch(TodoResource.create, [{ title: 'a' }]);
  expectType<Todo>()(created, true);
  const withParams = await ctrl.fetch(
    TodoResource.getList.push,
    { userId: 1 },
    [{ title: 'a' }],
  );
  expectType<Todo[]>()(withParams, true);
  const empty = await ctrl.fetch(TodoResource.getList.push, []);
  expectType<Todo[]>()(empty, true);
}

export async function singleBody() {
  const pushed = await ctrl.fetch(TodoResource.getList.push, { title: 'a' });
  expectType<Todo>()(pushed, true);
  const created = await ctrl.fetch(TodoResource.create, { title: 'a' });
  expectType<Todo>()(created, true);
  const withParams = await ctrl.fetch(
    TodoResource.getList.unshift,
    { userId: 1 },
    { title: 'a' },
  );
  expectType<Todo>()(withParams, true);
  // FormData, a body that may be either, and an untyped body keep resolving one item
  const form = await ctrl.fetch(TodoResource.create, new FormData());
  expectType<Todo>()(form, true);
  const either = {} as Partial<Todo> | Partial<Todo>[];
  const maybe = await ctrl.fetch(TodoResource.create, either);
  expectType<Todo>()(maybe, true);
  const untyped: any = { title: 'a' };
  const fromAny = await ctrl.fetch(TodoResource.getList.push, untyped);
  expectType<Todo>()(fromAny, true);
  const fromAnyParams = await ctrl.fetch(
    TodoResource.getList.push,
    { userId: 1 },
    untyped,
  );
  expectType<Todo>()(fromAnyParams, true);
}

export function badArgs() {
  // @ts-expect-error not a Todo field
  ctrl.fetch(TodoResource.getList.push, { titel: 'a' });
  // @ts-expect-error not a Todo field
  ctrl.fetch(TodoResource.getList.push, [{ title: 'a', extra: 1 }]);
  ctrl.fetch(
    TodoResource.getList.push,
    // @ts-expect-error not a search param
    { userId: 1, extra: 1 },
    [{ title: 'a' }],
  );
  // @ts-expect-error title is a string
  ctrl.fetch(TodoResource.getList.push, [{ title: 5 }]);
  // @ts-expect-error id is a string or number
  ctrl.fetch(TodoResource.get, { id: true });
}

export async function otherSchemas() {
  // a Collection already resolves a list, even when its body is a list
  const replace = new RestEndpoint({
    path: '/todos',
    method: 'PUT',
    body: [] as Partial<Todo>[],
    schema: TodoResource.getList.schema,
  });
  const replaced = await ctrl.fetch(replace, [{ title: 'a' }]);
  expectType<Todo[]>()(replaced, true);

  const bulk = new RestEndpoint({
    path: '/todos',
    method: 'POST',
    body: [] as Partial<Todo>[],
    schema: TodoResource.getList.schema.push,
  });
  const added = await ctrl.fetch(bulk, [{ title: 'a' }]);
  expectType<Todo[]>()(added, true);

  const noSchema = new RestEndpoint({
    path: '/todos',
    method: 'POST',
    body: [] as Partial<Todo>[],
  });
  const raw = await ctrl.fetch(noSchema, [{ title: 'a' }]);
  expectType<any>()(raw, true);
}

export function adderSchema() {
  const push = TodoResource.getList.schema.push;
  expectType<Todo>()({} as Denormalize<typeof push>, true);
  expectType<Todo | undefined>()({} as DenormalizeNullable<typeof push>, true);
  expectType<string>()({} as Normalize<typeof push>, true);
  ctrl.set(push, { userId: 1 }, { id: 5, title: 'a' });
  // @ts-expect-error not a Todo field
  ctrl.set(push, { userId: 1 }, { id: 5, titel: 'a' });
}

export function wrapsFetch() {
  const collection = new Collection([Todo]);
  collection.push.schema;
  // generic helpers that forward to fetch keep compiling
  function forward<E extends EndpointInterface>(
    endpoint: E,
    ...args: Parameters<E>
  ) {
    return ctrl.fetch(endpoint, ...args);
  }
  forward(TodoResource.get, { id: 5 });
  const { fetch } = ctrl;
  return fetch(TodoResource.getList.push, [{ title: 'a' }]);
}

// subclasses that declare fetch with its previous signature keep compiling
export class LoggingController extends Controller {
  fetch = <
    E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): E['schema'] extends undefined | null ? ReturnType<E>
  : Promise<Denormalize<E['schema']>> => {
    return endpoint(...args) as any;
  };
}

export async function untypedResults() {
  // with an `as any` cast, the overloads must not change what an endpoint resolves
  const get = await ctrl.fetch(TodoResource.get, { id: 5 } as any);
  expectType<Todo>()(get, true);
  const list = await ctrl.fetch(TodoResource.getList, {} as any);
  expectType<Todo[]>()(list, true);
}
