import { Schema, Denormalize, schema } from '@rest-hooks/endpoint';

import RestEndpoint, {
  GetEndpoint,
  MutateEndpoint,
  RestTypeNoBody,
} from './RestEndpoint';
import { shortenPath } from './RestHelpers';
import { PathArgs, ShortenPath } from './types';

const { Delete } = schema;

export default function createResource<
  U extends string,
  S extends Schema,
  R extends
    | ((...args: any) => PathArgs<ShortenPath<U>>)
    | undefined = undefined,
>(
  path: U,
  schema: S,
  Endpoint: typeof RestEndpoint = RestEndpoint,
  removeCursor?: R,
): Resource<U, S, R> {
  const shortenedPath = shortenPath(path);
  const getName = (name: string) => `${(schema as any)?.name}.${name}`;
  const getList = new Endpoint({
    path: shortenedPath,
    schema: [schema],
    name: getName('getList'),
  });
  return {
    get: new Endpoint({ path, schema, name: getName('get') }),
    getList: new Endpoint({
      path: shortenedPath,
      schema: [schema],
      name: getName('getList'),
    }),
    getNextPage: removeCursor
      ? getList.paginated(removeCursor as any)
      : undefined,
    create: new Endpoint({
      path: shortenedPath,
      schema,
      method: 'POST',
      name: getName('create'),
    }),
    update: new Endpoint({
      path,
      schema,
      method: 'PUT',
      name: getName('update'),
    }),
    partialUpdate: new Endpoint({
      path,
      schema,
      method: 'PATCH',
      name: getName('partialUpdate'),
    }),
    delete: new Endpoint({
      path,
      schema: (schema as any).process ? new Delete(schema as any) : schema,
      method: 'DELETE',
      name: getName('delete'),
      process(res, params) {
        return res && Object.keys(res).length ? res : params;
      },
    }),
  } as any;
}

export interface BaseResource<U extends string, S extends Schema> {
  get: GetEndpoint<PathArgs<U>, S>;
  getList: GetEndpoint<PathArgs<ShortenPath<U>>, S[]>;
  create: MutateEndpoint<PathArgs<ShortenPath<U>>, Partial<Denormalize<S>>, S>;
  update: MutateEndpoint<PathArgs<U>, Partial<Denormalize<S>>, S>;
  partialUpdate: MutateEndpoint<PathArgs<U>, Partial<Denormalize<S>>, S>;
  delete: RestTypeNoBody<
    PathArgs<U>,
    S extends schema.EntityInterface & { process: any } ? schema.Delete<S> : S,
    undefined,
    Partial<PathArgs<U>>
  >;
}

export interface PaginatableResource<
  U extends string,
  S extends Schema,
  R extends (...args: any) => PathArgs<ShortenPath<U>>,
> extends BaseResource<U, S> {
  getNextPage: R extends (...args: infer A) => any
    ? GetEndpoint<A, S[]>
    : undefined;
}
export type Resource<
  U extends string,
  S extends Schema,
  R extends
    | ((...args: any) => PathArgs<ShortenPath<U>>)
    | undefined = undefined,
> = R extends (...args: any) => any
  ? PaginatableResource<U, S, R>
  : BaseResource<U, S>;
