import { Denormalize, Entity, Schema } from '@rest-hooks/rest';
import {
  RestEndpoint,
  createResource,
  ResourceGenerics,
  ResourceOptions,
  Resource,
} from '@rest-hooks/rest/next';

export abstract class PlaceholderEntity extends Entity {
  readonly id: number = 0;

  // all Resources of `jsonplaceholder` use an id for the primary key
  pk() {
    return `${this.id}`;
  }
}

/** Common patterns in the https://jsonplaceholder.typicode.com API */
export function createPlaceholderResource<O extends ResourceGenerics = any>({
  path,
  schema,
  Endpoint = RestEndpoint,
}: Readonly<O> & ResourceOptions): Resource<O> {
  const base = createResource({
    path,
    schema,
    Endpoint,
    urlPrefix: 'https://jsonplaceholder.typicode.com',
    // hour expiry time since we want to keep our example mutations and the api itself never actually changes
    dataExpiryLength: 1000 * 60 * 60,
  });
  const partialUpdate = base.partialUpdate.extend({
    fetch: async function (...args: any) {
      // body only contains what we're changing, but we can find the id in params
      return {
        ...(await base.partialUpdate.call(this, ...args)),
        id: args?.[0]?.id,
      } as any;
    },
  });
  return {
    ...base,
    // Endpoint overrides are to compensate for the jsonplaceholder API not returning
    // the correct ID in certain cases
    //
    // This is sometimes needed when you don't control the server API itself
    // More here: https://resthooks.io/docs/guides/network-transform#case-of-the-missing-id
    partialUpdate,
    create: base.create.extend({
      fetch: async function (...args: any) {
        // body only contains what we're changing, but we can find the id in params
        return {
          ...(await base.create.call(this, ...args)),
          id: args?.[args.length - 1]?.id,
        } as any;
      },
    }),
    // generics don't match up well
  } as any;
}
