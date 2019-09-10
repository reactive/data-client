import request from 'superagent';
import { Method } from '~/types';

import SimpleResource from './SimpleResource';

const ResourceError = `JSON expected but not returned from API`;

export const isInvalidResponse = (res: request.Response): boolean => {
  // Empty is only valid when no response is expect (204)
  const resEmptyIsExpected = res.text === '' && res.status === 204;
  const resBodyEmpty = Object.keys(res.body).length === 0;
  return !(res.type.includes('json') || resEmptyIsExpected) && resBodyEmpty;
};

/**
 * Represents an entity to be retrieved from a server.
 * Typically 1:1 with a url endpoint.
 */
export default abstract class Resource extends SimpleResource {
  /** A function to mutate all requests for fetch */
  static fetchPlugin?: request.Plugin;

  /** Perform network request and resolve with json body */
  static fetch<T extends typeof Resource>(
    this: T,
    method: Method,
    url: string,
    body?: Readonly<object | string>,
  ) {
    let req = request[method](url).on('error', () => {});
    if (this.fetchPlugin) req = req.use(this.fetchPlugin);
    if (body) req = req.send(body);
    return req.then(res => {
      if (isInvalidResponse(res)) {
        throw new Error(ResourceError);
      }
      return res.body;
    });
  }
}
