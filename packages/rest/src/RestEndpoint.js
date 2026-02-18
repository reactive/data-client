import { Endpoint } from '@data-client/endpoint';
import { pathToRegexp } from 'path-to-regexp';

import extractCollection from './extractCollection.js';
import mapCollection from './mapCollection.js';
import NetworkError from './NetworkError.js';
import { createPaginationSchema } from './paginatedCollections.js';
import paramsToString from './paramsToString.js';
import { getUrlBase, getUrlTokens, isPojo } from './RestHelpers.js';

/** Simplifies endpoint definitions that follow REST patterns
 *
 * @see https://dataclient.io/rest/api/RestEndpoint
 */
export default class RestEndpoint extends Endpoint {
  #hasBody;
  constructor(options) {
    super(
      options.fetch ??
        async function (...args) {
          const urlParams =
            this.#hasBody && args.length < 2 ? {} : args[0] || {};
          const body = this.#hasBody ? args[args.length - 1] : undefined;
          return this.fetchResponse(
            this.url(urlParams),
            await this.getRequestInit(body),
          )
            .then(response => this.parseResponse(response))
            .then(res => this.process(res, ...args));
        },
      options,
    );
    // we want to use the prototype chain here
    if (
      !('sideEffect' in this) ||
      ('method' in options && !('sideEffect' in options))
    ) {
      this.sideEffect =
        options.method === 'GET' || options.method === undefined ?
          undefined
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

    Object.defineProperty(this, 'name', {
      get() {
        // using 'in' to ensure inheritance lookup
        if ('__name' in this) return this.__name;
        return this.urlPrefix + this.path;
      },
    });
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
      return `${this.urlPrefix}${urlBase}?${this.searchToString(searchParams)}`;
    }
    return `${this.urlPrefix}${urlBase}`;
  }

  /** Encode the url searchParams */
  searchToString(searchParams) {
    return paramsToString(searchParams);
  }

  getHeaders(headers) {
    return headers;
  }

  /** Init options for fetch - run at fetch */
  async getRequestInit(body) {
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
    init.headers = await this.getHeaders(init.headers);
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
          error.status = 500;
        }
        throw error;
      });
  }

  parseResponse(response) {
    // this should not have any content to read
    if (response.status === 204) return Promise.resolve(null);
    if (!response.headers.get('content-type')?.includes('json')) {
      return response.text().then(text => {
        // string or 'not set' schema, are valid
        // when overriding process they might handle other cases, so we don't want to block on our logic
        if (
          ['string', 'undefined'].includes(typeof this.schema) ||
          this.schema === null ||
          this.process !== RestEndpoint.prototype.process
        )
          return text;

        const error = new NetworkError(response);
        error.status = 404;
        error.message = `Unexpected text response for schema ${this.schema}`;
        // custom dev-only messages for more detailed cause
        /* istanbul ignore else */
        if (process.env.NODE_ENV !== 'production') {
          if (
            !(
              response.headers.get('content-type')?.includes('html') ||
              text.startsWith('<!doctype html>')
            )
          ) {
            if (tryParse(text) !== undefined) {
              error.message = `"content-type" header does not include "json", but JSON response found.
See https://www.rfc-editor.org/rfc/rfc4627 for information on JSON responses

Using parsed JSON.
If text content was expected see https://dataclient.io/rest/api/RestEndpoint#parseResponse`;
            }
          } else {
            error.message = `Unexpected html response for schema ${this.schema}
This likely means no API endpoint was configured for this request, resulting in an HTML fallback.

Response (first 300 characters): ${text.substring(0, 300)}`;
          }
        }
        throw error;
      });
    }
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

  get pathRegex() {
    return pathToRegexp(this.path);
  }

  testKey(key) {
    const prefix = this.method + ' ' + this.urlPrefix;
    if (!key.startsWith(prefix)) return false;
    let lastQuestion = key.lastIndexOf('?');
    if (lastQuestion === -1) lastQuestion = undefined;
    return this.pathRegex.test(key.substring(prefix.length, lastQuestion));
  }

  extend(options) {
    // make a constructor/prototype based off this
    // extend from it and init with options sent
    class E extends this.constructor {}

    Object.assign(E.prototype, this);

    return new E(
      //  fetch get overridden by function prototype, so we must set it explicitly every time
      { fetch: this.fetch, ...options },
    );
  }

  paginated(removeCursor) {
    if (typeof removeCursor === 'string') {
      const fieldName = removeCursor;
      removeCursor = ({ ...params }) => {
        delete params[fieldName];
        return [params];
      };
    }
    let found = false;
    const createPaginatedSchema = collection => {
      found = true;
      return createPaginationSchema(removeCursor, collection);
    };
    const newSchema = mapCollection(this.schema, createPaginatedSchema);

    if (!found) throw new Error('Missing Collection');
    const sup = this;

    return this.extend({
      schema: newSchema,
      key(...args) {
        return sup.key.call(this, ...removeCursor(...args));
      },
      name: this.name + '.getPage',
    });
  }

  get getPage() {
    return this.paginated(this.paginationField);
  }

  get push() {
    return this.extend({
      method: 'POST',
      schema: extractCollection(this.schema, s => s.push),
      name: this.name + '.create',
    });
  }

  get unshift() {
    return this.extend({
      method: 'POST',
      schema: extractCollection(this.schema, s => s.unshift),
      name: this.name + '.create',
    });
  }

  get assign() {
    return this.extend({
      method: 'POST',
      schema: extractCollection(this.schema, s => s.assign),
      name: this.name + '.create',
    });
  }

  get remove() {
    return this.extend({
      method: 'PATCH',
      schema: extractCollection(this.schema, s => s.remove),
      name: this.name + '.remove',
    });
  }

  get move() {
    const options = {
      method: 'PATCH',
      schema: extractCollection(this.schema, s => s.move),
      searchParams: undefined,
      name: this.name + '.partialUpdate',
    };
    if (this.movePath) options.path = this.movePath;
    return this.extend(options);
  }
}

const tryParse = input => {
  try {
    return JSON.parse(input);
  } catch (e) {
    return undefined;
  }
};
