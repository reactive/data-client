import { Endpoint } from '@rest-hooks/endpoint';

import { getUrlBase, getUrlTokens, isPojo } from './RestHelpers';
import paramsToString from './paramsToString';
import NetworkError from './NetworkError';
import paginationUpdate from './paginationUpdate';

/** Simplifies endpoint definitions that follow REST patterns
 *
 * @see https://resthooks.io/docs/api/RestEndpoint
 */
export default class RestEndpoint extends Endpoint {
  constructor(options) {
    super(function (...args) {
      const hasBody = !['GET', 'DELETE'].includes(this.method);
      const urlParams = hasBody && args.length < 2 ? {} : args[0] || {};
      const body = hasBody ? args[args.length - 1] : undefined;
      return this.fetchResponse(this.url(urlParams), this.getFetchInit(body))
        .then(this.parseResponse)
        .then(res => this.process(res, ...args));
    }, options);
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
  }

  key(...args) {
    const hasBody = !['GET', 'DELETE'].includes(this.method);
    return `${this.method} ${this.url(
      hasBody && args.length < 2 ? {} : args[0] || {},
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
      return `${urlBase}?${paramsToString(searchParams)}`;
    }
    return urlBase;
  }

  /** Init options for fetch - run at fetch */
  getFetchInit(body) {
    const bodyIsPojo = isPojo(body);
    if (bodyIsPojo) {
      body = JSON.stringify(body);
    }
    const init = {
      ...this.fetchInit,
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
    if ('fetch' in options)
      throw new Error('fetch overrides not allowed for RestEndpoint');

    // make a constructor/prototype based off this
    // extend from it and init with options sent
    class E extends this.constructor {}

    Object.assign(E.prototype, this);
    const instance = new E(
      // name gets overridden by function prototype, so we must set it explicitly every time
      this.name ? { ...options, name: this.name } : options,
    );

    return instance;
  }

  paginated(removeCursor) {
    return this.extend({ update: paginationUpdate(this, removeCursor) });
  }
}
