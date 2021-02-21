/* istanbul ignore file */

import type { Method } from './types';
import SimpleResource from './SimpleResource';

class NetworkError extends Error {
  declare status: number;
  declare response: Response;

  constructor(response: Response) {
    super(response.statusText);
    this.status = response.status;
    this.response = response;
  }
}

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 */
export default abstract class Resource extends SimpleResource {
  /** A function to mutate all request options for fetch */
  static fetchOptionsPlugin?: (options: RequestInit) => RequestInit;

  /** Perform network request and resolve with HTTP Response */
  static fetchResponse(
    method: Method,
    url: string,
    body?: Readonly<object | string>,
  ) {
    let options: RequestInit = {
      method: method.toUpperCase(),
    };
    if (this.fetchOptionsPlugin) options = this.fetchOptionsPlugin(options);
    if (body) options.body = JSON.stringify(body);
    if (!(body instanceof FormData)) {
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
