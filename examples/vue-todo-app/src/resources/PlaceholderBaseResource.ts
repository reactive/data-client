import {
  resource,
  ResourceGenerics,
  ResourceOptions,
  Resource,
  Entity,
} from '@data-client/rest';
import { v4 as uuid } from 'uuid';

export abstract class PlaceholderEntity extends Entity {
  // all Resources of `jsonplaceholder` use an id for the primary key
  id = 0;
}

/** Common patterns in the https://jsonplaceholder.typicode.com API */
export function placeholderResource<O extends ResourceGenerics = any>(
  options: Readonly<O> & ResourceOptions,
): Resource<O> {
  return resource({
    ...options,
    urlPrefix: 'https://jsonplaceholder.typicode.com',
    // hour expiry time since we want to keep our example mutations and the api itself never actually changes
    dataExpiryLength: 1000 * 60 * 60,
  } as O).extend({
    // Endpoint overrides are to compensate for the jsonplaceholder API not returning
    // the correct ID in certain cases
    //
    // This is sometimes needed when you don't control the server API itself
    // More here: https://dataclient.io/docs/guides/network-transform#case-of-the-missing-id
    partialUpdate: {
      process(response: any, ...args: any[]) {
        // body only contains what we're changing, but we can find the id in params
        return {
          ...response,
          id: args?.[0]?.id,
        };
      },
    },
    getList: {
      process(response: any, ...args: any[]) {
        if (Array.isArray(response)) return response;
        // for POST (push/unshift)
        return {
          ...response,
          id: randomId(),
        };
      },
    },
  }) as any;
}
function randomId() {
  return Number.parseInt(uuid().slice(0, 8), 16);
}
