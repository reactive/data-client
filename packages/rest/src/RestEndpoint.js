import { Endpoint } from '@rest-hooks/endpoint';

import { getUrlBase, getUrlTokens, isPojo } from './RestHelpers.js';
import paramsToString from './paramsToString.js';
import NetworkError from './NetworkError.js';
import paginationUpdate from './paginationUpdate.js';

/** Simplifies endpoint definitions that follow REST patterns
 *
 * @see https://resthooks.io/rest/api/RestEndpoint
 */
export default class RestEndpoint extends Endpoint {
  #hasBody;
  constructor(options) {
    super(
      options.fetch ??
        function (...args) {
          const urlParams =
            this.#hasBody && args.length < 2 ? {} : args[0] || {};
          const body = this.#hasBody ? args[args.length - 1] : undefined;
          return this.fetchResponse(
            this.url(urlParams),
            this.getRequestInit(body),
          )
            .then(this.parseResponse)
            .then(res => this.process(res, ...args));
        },
      options,
    );
    // we want to use the prototype chain here
    if (!('sideEffect' in this)) {
      this.sideEffect =
        options.method === 'GET' || options.method === undefined
          ? undefined
          : true;
    }
    if (this.method === undefined) {
      this.method = this.sideEffect ? 'POST' : 'GET';
    }
    if (this.urlPrefix === undefined) {
      this.urlPrefix = '';
    }
    this.#hasBody =
      (!('body' in this) || this.body !== undefined) &&
      !['GET', 'DELETE'].includes(this.method);
  }

  key(...args) {
    return `${this.method} ${this.url(
      this.#hasBody && args.length < 2 ? {} : args[0] || {},
    )}`;
  }

  /** Get the url */
  url(urlParams = {}) {
    const urlBase = getUrlBase(this.path)(urlParams);
    const tokens = getUrlTokens(this.path);
    const searchParams = {};
    Object.keys(urlParams).forEach(k => {
      if (!tokens.has(k)) {
        searchParams[k] = urlParams[k];
      }
    });
    if (Object.keys(searchParams).length) {
      return `${this.urlPrefix}${urlBase}?${paramsToString(searchParams)}`;
    }
    return `${this.urlPrefix}${urlBase}`;
  }

  getHeaders(headers) {
    return headers;
  }

  /** Init options for fetch - run at fetch */
  getRequestInit(body) {
    const bodyIsPojo = isPojo(body);
    if (bodyIsPojo) {
      body = JSON.stringify(body);
    }
    const init = {
      ...this.requestInit,
      method: this.method,
      signal: this.signal,
      body,
    };
    if (!body || bodyIsPojo) {
      init.headers = {
        // default to application/json but allow user explicit overrides
        'Content-Type': 'application/json',
        ...init.headers,
      };
    }
    init.headers = this.getHeaders(init.headers);
    return init;
  }

  /** Perform network request and resolve with HTTP Response */
  fetchResponse(input, init) {
    return fetch(input, init)
      .then(response => {
        if (!response.ok) {
          throw new NetworkError(response);
        }
        return response;
      })
      .catch(error => {
        // ensure CORS, network down, and parse errors are still caught by NetworkErrorBoundary
        if (error instanceof TypeError) {
          error.status = 400;
        }
        throw error;
      });
  }

  parseResponse(response) {
    if (
      !response.headers.get('content-type')?.includes('json') ||
      response.status === 204
    )
      return response.text();
    return response.json().catch(error => {
      error.status = 400;
      throw error;
    });
  }

  process(value) {
    return value;
  }

  errorPolicy(error) {
    return error.status >= 500 ? 'soft' : undefined;
  }

  extend(options) {
    // fetch overrides are banned
    /*if ('fetch' in options)
      throw new Error('fetch overrides not allowed for RestEndpoint');
      we now just only allow the same type*/

    // make a constructor/prototype based off this
    // extend from it and init with options sent
    class E extends this.constructor {}

    Object.assign(E.prototype, this);
    const instance = new E(
      // name and fetch get overridden by function prototype, so we must set it explicitly every time
      this.name
        ? { name: this.name, fetch: this.fetch, ...options }
        : { fetch: this.fetch, ...options },
    );

    return instance;
  }

  paginated(removeCursor) {
    return this.extend({ update: paginationUpdate(this, removeCursor) });
  }
}
