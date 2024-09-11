import { GQLEndpoint } from '@data-client/graphql';
import { Entity, Schema, ShortenPath, schema } from '@data-client/rest';
import {
  GetEndpoint,
  RestGenerics,
  RestEndpoint,
  Resource,
  resource,
  ResourceGenerics,
  ResourceOptions,
} from '@data-client/rest';
import { camelCase, snakeCase } from 'lodash';

import { getAuth } from './Auth';

const HOST = 'https://api.github.com';

export class GithubEntity extends Entity {
  readonly id: number = -1;
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

  async getRequestInit(body: any) {
    let init: RequestInit;
    if (body) {
      init = await super.getRequestInit(
        deeplyApplyKeyTransform(body, snakeCase),
      );
    } else {
      init = await super.getRequestInit(body);
    }
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
      (this.schema as any)?.link ||
      (this.schema as any)?.results
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

export function githubResource<O extends ResourceGenerics>(
  options: Readonly<O> & ResourceOptions,
): GithubResource<O> {
  const baseResource = resource({
    Endpoint: GithubEndpoint,
    paginationField: 'page',
    ...options,
  });

  return baseResource.extend({
    getList: {
      schema: {
        results: baseResource.getList.schema as schema.Collection<
          O['schema'][]
        >,
        link: '',
      },
    },
  }) as any;
}

export interface GithubResource<
  O extends ResourceGenerics = {
    path: string;
    schema: Schema;
    paginationField: 'page';
  },
> extends Omit<Resource<O>, 'getList'> {
  getList: GetEndpoint<
    Omit<O, 'schema' | 'path'> & {
      readonly path: ShortenPath<O['path']>;
      readonly schema: {
        results: schema.Collection<O['schema'][]>;
        link: string;
      };
      readonly paginationField: 'page';
    }
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
