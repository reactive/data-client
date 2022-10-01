import { Entity, Schema } from '@rest-hooks/endpoint';
import { GQLEndpoint } from '@rest-hooks/graphql';
import { camelCase, snakeCase } from 'lodash';
import {
  PathArgs,
  RestEndpoint,
  ShortenPath,
  Resource,
  createResource,
  GetEndpoint,
  RestGenerics,
} from '@rest-hooks/rest';

import { getAuth } from './Auth';

const HOST = 'https://api.github.com';

export class GithubEntity extends Entity {
  readonly id: number = -1;

  pk() {
    return this.id?.toString();
  }
}

export const GithubGqlEndpoint = new GQLEndpoint(
  'https://api.github.com/graphql',
  {
    getHeaders(headers: HeadersInit): HeadersInit {
      if (getAuth()) {
        return {
          ...headers,
          Authorization: 'Basic ' + getAuth(),
        };
      }
      return headers;
    },
  },
);

/** Impelements the common functionality for all Resources we'll make */
export class GithubEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  urlPrefix = HOST;

  getRequestInit(body: any): RequestInit {
    let init: RequestInit;
    if (body) {
      init = super.getRequestInit(deeplyApplyKeyTransform(body, snakeCase));
    }
    init = super.getRequestInit(body);
    if (getAuth()) {
      init.mode = 'cors';
      init.headers = {
        ...init.headers,
        Authorization: 'Basic ' + getAuth(),
      };
    }
    return init;
  }

  async parseResponse(response: Response) {
    const results = await super.parseResponse(response);
    if (
      (response.headers && response.headers.has('link')) ||
      Array.isArray(results)
    ) {
      return {
        link: response.headers.get('link'),
        results,
      };
    }
    return results;
  }

  process(value: any, ...args: any) {
    return deeplyApplyKeyTransform(value, camelCase);
  }
}

export function createGithubResource<U extends string, S extends Schema>({
  path,
  schema,
  Endpoint = GithubEndpoint,
}: {
  readonly path: U;
  readonly schema: S;
  readonly Endpoint?: typeof GithubEndpoint;
}): GithubResource<U, S> {
  const baseResource = createResource({ path, schema, Endpoint });

  const getList: GetEndpoint<
    PathArgs<ShortenPath<U>>,
    { results: S[]; link: string }
  > = baseResource.getList.extend({
    schema: { results: [schema], link: '' },
  }) as any;
  const getNextPage = getList.paginated(
    ({ page, ...rest }: { page: string | number } & PathArgs<ShortenPath<U>>) =>
      (Object.keys(rest).length ? [rest] : []) as any,
  );

  return {
    ...baseResource,
    getList,
    getNextPage,
  };
}

export interface GithubResource<U extends string, S extends Schema>
  extends Omit<Resource<U, S>, 'getList'> {
  getList: GetEndpoint<
    PathArgs<ShortenPath<U>>,
    { results: S[]; link: string }
  >;
  getNextPage: GetEndpoint<
    PathArgs<ShortenPath<U>> & { page: string | number },
    { results: S[]; link: string }
  >;
}

function deeplyApplyKeyTransform(obj: any, transform: (key: string) => string) {
  const ret: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] != null && typeof obj[key] === 'object') {
      ret[transform(key)] = deeplyApplyKeyTransform(obj[key], transform);
    } else {
      ret[transform(key)] = obj[key];
    }
  });
  return ret;
}
