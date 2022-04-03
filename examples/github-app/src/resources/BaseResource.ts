import { camelCase, snakeCase } from 'lodash';
import {
  Resource,
  RestEndpoint,
  Paginatable,
  FetchGet,
} from '@rest-hooks/experimental';

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

/** Impelements the common functionality for all Resources we'll make */
export default abstract class BaseResource extends Resource {
  static process(input: any) {
    const copy = { ...input };
    delete copy.url;
    return copy;
  }

  static async fetch(input: RequestInfo, init: RequestInit) {
    // we'll need to do the inverse operation when sending data back to the server
    if (init.body) {
      init.body = deeplyApplyKeyTransform(init.body, snakeCase);
    }
    // perform actual network request getting back json
    const jsonResponse = await super.fetch(input, init);
    // do the conversion!
    return deeplyApplyKeyTransform(jsonResponse, camelCase);
  }

  /** Shape to get a list of entities */
  static list<T extends typeof Resource>(
    this: T,
  ): Paginatable<
    RestEndpoint<FetchGet, { results: T[]; link: string }, undefined>
  > {
    const instanceFetchResponse = this.fetchResponse.bind(this);

    return super.list().extend({
      fetch: async function (params: Readonly<object>) {
        const response = await instanceFetchResponse(
          this.url(params),
          this.getFetchInit(),
        );
        return {
          link: response.headers.get('link'),
          results: deeplyApplyKeyTransform(
            await response.json().catch((error: any) => {
              error.status = 400;
              throw error;
            }),
            camelCase,
          ),
        };
      },
      schema: { results: [this], link: '' },
    });
  }

  static listPage<T extends typeof BaseResource>(
    this: T,
  ): Paginatable<
    RestEndpoint<
      FetchGet<[{ page: number } & Parameters<ReturnType<T['list']>>[0]]>,
      { results: T[]; link: string },
      undefined
    >
  > {
    return this.list().paginated(({ page, ...rest }) => [rest]);
  }
}
