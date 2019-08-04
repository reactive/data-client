import request from 'superagent';
import { Method } from '~/types';

import SimpleResource from './SimpleResource';

/** Represents an entity to be retrieved from a server. Typically 1:1 with a url endpoint. */
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
      if (process.env.NODE_ENV !== 'production') {
        if (!res.type.includes('json') && Object.keys(res.body).length === 0) {
          throw new Error('JSON expected but not returned from API');
        }
      }
      return res.body;
    });
  }
}
