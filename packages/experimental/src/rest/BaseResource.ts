import { Endpoint } from '@rest-hooks/endpoint';
import type { EndpointExtraOptions } from '@rest-hooks/endpoint';
import type { Schema } from '@rest-hooks/normalizr';
import { EntityRecord } from '@rest-hooks/rest';

import paramsToString from './paramsToString';
import { RestEndpoint } from './types';

class NetworkError extends Error {
  declare status: number;
  declare response: Response;

  constructor(response: Response) {
    super(response.statusText);
    this.status = response.status;
    this.response = response;
  }
}

/** Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 *
 * This can be a useful organization for many REST-like API patterns.
 * @see https://resthooks.io/docs/api/resource
 */
export default abstract class BaseResource extends EntityRecord {
  // typescript todo: require subclasses to implement
  /** Used as base of url construction */
  static readonly urlRoot: string;

  static toString() {
    return `${this.name}::${this.urlRoot}`;
  }

  /** Returns the globally unique identifier for this SimpleResource */
  static get key(): string {
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      if (this.urlRoot === undefined) {
        throw new Error(`urlRoot is not defined for Resource "${this.name}"

  Resources require a 'static urlRoot' or 'static get key()' defined.
  (See https://resthooks.io/docs/api/resource#static-urlroot-string)
`);
      }
    }
    return this.urlRoot;
  }

  /** URL to find this SimpleResource */
  declare readonly url: string;

  private declare __url?: string;

  /** Get the url for a SimpleResource
   *
   * Default implementation conforms to common REST patterns
   */
  static url(urlParams: Readonly<Record<string, any>>): string {
    if (
      Object.prototype.hasOwnProperty.call(urlParams, 'url') &&
      urlParams.url &&
      typeof urlParams.url === 'string'
    ) {
      return urlParams.url;
    }
    if (this.pk(urlParams as any) !== undefined) {
      return `${this.urlRoot.replace(/\/$/, '')}/${this.pk(urlParams as any)}`;
    }
    return this.urlRoot;
  }

  /** Get the url for many SimpleResources
   *
   * Default implementation conforms to common REST patterns
   */
  static listUrl(
    searchParams: Readonly<Record<string, string | number | boolean>> = {},
  ): string {
    if (Object.keys(searchParams).length) {
      return `${this.urlRoot}?${paramsToString(searchParams)}`;
    }
    return this.urlRoot;
  }

  /** Perform network request and resolve with HTTP Response */
  static fetchResponse(input: RequestInfo, init: RequestInit) {
    let options: RequestInit = init;
    if (!options.body || typeof options.body === 'string') {
      options = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };
    }
    return fetch(input, options)
      .then(response => {
        if (!response.ok) {
          throw new NetworkError(response);
        }
        return response;
      })
      .catch(error => {
        // ensure CORS, network down, and parse errors are still caught by NetworkErrorBoundary
        if (error instanceof TypeError) {
          (error as any).status = 400;
        }
        throw error;
      });
  }

  /** Perform network request and resolve with json body */
  static fetch(input: RequestInfo, init: RequestInit) {
    return this.fetchResponse(input, init).then((response: Response) => {
      if (
        !response.headers.get('content-type')?.includes('json') ||
        response.status === 204
      )
        return response.text();
      return response.json().catch(error => {
        error.status = 400;
        throw error;
      });
    });
  }

  /** Init options for fetch - run at fetch */
  static getFetchInit(init: Readonly<RequestInit>): RequestInit {
    return init;
  }

  /** Init options for fetch - run at render */
  static useFetchInit(init: Readonly<RequestInit>): RequestInit {
    return init;
  }

  /** Get the request options for this SimpleResource */
  static getEndpointExtra(): EndpointExtraOptions | undefined {
    return {
      errorPolicy: error =>
        error.status >= 500 ? ('soft' as const) : undefined,
    };
  }

  /** Field where endpoint cache is stored */
  protected static readonly cacheSymbol = Symbol('memo');

  /** Used to memoize endpoint methods
   *
   * Relies on existance of runInit() member.
   */
  protected static memo<T extends { extend: (...args: any) => any }>(
    name: string,
    construct: () => T,
  ): T {
    if (!Object.hasOwnProperty.call(this, this.cacheSymbol)) {
      (this as any)[this.cacheSymbol] = {};
    }
    const cache = (this as any)[this.cacheSymbol];
    if (!(name in cache)) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const resource: any = this;
      cache[name] = construct().extend({
        get name() {
          return `${resource.name}.${name.replace(/#/, '')}`;
        },
      });
    }
    return cache[name].useFetchInit() as T;
  }

  /** Base endpoint that uses all the hooks provided by Resource  */
  protected static endpoint(): RestEndpoint<
    (this: RestEndpoint, params: any) => Promise<any>,
    Schema | undefined,
    undefined
  > {
    return this.memo('#endpoint', () => {
      // eslint-disable-next-line
      const resource = this;
      const instanceFetch = this.fetch.bind(this);
      const url = this.url.bind(this);

      return new Endpoint(
        function (params: any) {
          return instanceFetch(this.url(params), this.getFetchInit());
        },
        {
          ...this.getEndpointExtra(),
          key: function (this: any, params: any) {
            return `${this.method} ${this.url(params)}`;
          },
          url,
          fetchInit: {} as RequestInit,
          useFetchInit(this: any) {
            this.fetchInit = resource.useFetchInit(this.fetchInit);
            return this;
          },
          getFetchInit(this: any, body?: any) {
            if (isPojo(body)) {
              body = JSON.stringify(body);
            }
            return resource.getFetchInit({
              ...this.fetchInit,
              method: this.method,
              signal: this.signal,
              body,
            });
          },
          method: 'GET',
          signal: undefined as AbortSignal | undefined,
        },
      );
    });
  }

  /** Base endpoint but for sideEffects */
  protected static endpointMutate(): RestEndpoint<
    (this: RestEndpoint, params: any, body?: any) => Promise<any>,
    Schema | undefined,
    true
  > {
    const instanceFetch = this.fetch.bind(this);
    return this.memo('#endpointMutate', () =>
      this.endpoint().extend({
        fetch(this: RestEndpoint, params: any, body: any) {
          return instanceFetch(this.url(params), this.getFetchInit(body));
        },
        sideEffect: true,
        method: 'POST',
      }),
    );
  }
}

// We're only allowing this to get set for descendants but
// by default we want Typescript to treat it as readonly.
Object.defineProperty(BaseResource.prototype, 'url', {
  get(): string {
    if (this.__url !== undefined) return this.__url;
    // typescript thinks constructor is just a function
    const Static = this.constructor as typeof BaseResource;
    return Static.url(this);
  },
  set(url: string) {
    this.__url = url;
  },
});

const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

function isPojo(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return gpo(obj) === proto;
}
