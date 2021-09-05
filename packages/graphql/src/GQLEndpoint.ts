import { Endpoint } from '@rest-hooks/endpoint';
import type { Schema } from '@rest-hooks/normalizr';

export default class GQLEndpoint<
  Variables,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends Endpoint<(v: Variables) => Promise<any>, S, M> {
  declare url: string;
  declare queryString: string;

  constructor(url: string, options?: Record<string, any>) {
    const args = url ? { url } : options;
    super(async function (this: GQLEndpoint<Variables, S>, variables: any) {
      const body = JSON.stringify({
        query: this.queryString,
        variables,
      });
      return fetch(this.url, {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(async res => {
        return (await res.json()).data;
      });
    }, args);
    return this;
  }

  query<
    Variables,
    S extends Schema | undefined = undefined,
    E extends GQLEndpoint<any, any> = GQLEndpoint<any, any>,
  >(
    this: E,
    queryString: string,
    schema?: S,
  ): GQLEndpoint<Variables, S, undefined> {
    return this.extend({
      queryString,
      schema: schema as any,
    } as any) as any;
  }

  mutation<
    Variables,
    S extends Schema | undefined = undefined,
    E extends GQLEndpoint<any, any> = GQLEndpoint<any, any>,
  >(this: E, queryString: string, schema?: S): GQLEndpoint<Variables, S, true> {
    return this.extend({
      queryString,
      schema: schema as any,
      sideEffect: true,
    } as any) as any;
  }
}
