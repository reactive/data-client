/* istanbul ignore file */

import SimpleResource from './SimpleResource.js';
import type { Method } from './types.js';

class NetworkError extends Error {
  declare status: number;
  declare response: Response;
  name = 'NetworkError';

  constructor(response: Response) {
    super(
      response.statusText || `Network response not 'ok': ${response.status}`,
    );
    this.status = response.status;
    this.response = response;
  }
}

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 */
/** @deprecated in favor of @rest-hooks/rest */
export default abstract class Resource extends SimpleResource {
  /** A function to mutate all request options for fetch */
  static fetchOptionsPlugin?: (options: RequestInit) => RequestInit;

  /** Init options for fetch - run at fetch */
  static getFetchInit(init: Readonly<RequestInit>): RequestInit {
    if (this.fetchOptionsPlugin) return this.fetchOptionsPlugin(init);
    return init;
  }

  /** Perform network request and resolve with HTTP Response */
  static fetchResponse(
    method: Method,
    url: string,
    body?: Readonly<object | string>,
  ) {
    let options: RequestInit = {
      method: method.toUpperCase(),
    };
    options = this.getFetchInit(options);
    if (body && isPojo(body)) options.body = JSON.stringify(body);
    else if (body) options.body = body;
    if (!options.body || typeof options.body === 'string') {
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
    }
    return fetch(url, options)
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
  static fetch(method: Method, url: string, body?: Readonly<object | string>) {
    return this.fetchResponse(method, url, body).then((response: Response) => {
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
}

const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

function isPojo(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return gpo(obj) === proto;
}
