import { Endpoint, EndpointOptions } from '@rest-hooks/endpoint';
import type { Schema } from '@rest-hooks/normalizr';
import GQLNetworkError from '@rest-hooks/graphql/GQLNetworkError';

export default class GQLEndpoint<
  Variables,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends Endpoint<(v: Variables) => Promise<any>, S, M> {
  declare url: string;
  declare signal?: AbortSignal;

  constructor(
    url: string,
    options?: EndpointOptions<(v: Variables) => Promise<any>, S, M> &
      GQLEndpoint<any>,
  ) {
    const args = url ? { ...options, url } : options;
    super(async function (this: GQLEndpoint<Variables, S>, variables: any) {
      return fetch(this.url, this.getFetchInit(variables)).then(async res => {
        const { data, errors } = await res.json();
        if (errors) throw new GQLNetworkError(errors);
        return data;
      });
    }, args);
    return this;
  }

  key(variables: Variables): string {
    // TODO: make this faster
    return `${this.getQuery(variables)} ${JSON.stringify(variables)}`;
  }

  getFetchInit(variables: Variables): RequestInit {
    return {
      body: JSON.stringify({
        query: this.getQuery(variables),
        variables,
      }),
      method: 'POST',
      signal: this.signal,
      headers: this.getHeaders(variables),
    };
  }

  getQuery(variables: Variables): string {
    throw new Error('You must include a query');
  }

  getHeaders(variables: Variables): HeadersInit {
    return { 'Content-Type': 'application/json' };
  }

  query<
    Q extends string | ((variables: any) => string),
    S extends Schema | undefined,
    E extends GQLEndpoint<any, any> = GQLEndpoint<any, any>,
  >(
    this: E,
    queryOrGetQuery: Q,
    schema?: S,
  ): GQLEndpoint<
    Q extends (variables: infer V) => string ? V : any,
    S,
    undefined
  > {
    const options: any = {
      schema,
      getQuery:
        typeof queryOrGetQuery === 'function'
          ? queryOrGetQuery
          : () => queryOrGetQuery,
    };
    return this.extend(options) as any;
  }

  mutation<
    Q extends string | ((variables: any) => string),
    S extends Schema | undefined,
    E extends GQLEndpoint<any, any> = GQLEndpoint<any, any>,
  >(
    this: E,
    queryOrGetQuery: Q,
    schema?: S,
  ): GQLEndpoint<
    Q extends (variables: infer V) => string ? V : any,
    S,
    undefined
  > {
    const options: any = {
      sideEffect: true,
      schema,
      getQuery:
        typeof queryOrGetQuery === 'function'
          ? queryOrGetQuery
          : () => queryOrGetQuery,
    };
    return this.extend(options) as any;
  }
}
