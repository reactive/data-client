import { Resource } from '@rest-hooks/rest';

/** Common patterns in the https://jsonplaceholder.typicode.com API */
export default abstract class PlaceholderBaseResource extends Resource {
  readonly id: number = 0;

  // all Resources of `jsonplaceholder` use an id for the primary key
  pk() {
    return `${this.id}`;
  }

  // Endpoint overrides are to compensate for the jsonplaceholder API not returning
  // the correct ID in certain cases
  //
  // This is sometimes needed when you don't control the server API itself
  // More here: https://resthooks.io/docs/guides/network-transform#case-of-the-missing-id

  static partialUpdate<T extends typeof Resource>(this: T) {
    const endpoint = super.partialUpdate();
    return endpoint.extend({
      fetch: async (params: any, body: any) => {
        // body only contains what we're changing, but we can find the id in params
        return { ...(await endpoint(params, body)), id: params.id };
      },
    });
  }

  static create<T extends typeof Resource>(this: T) {
    const endpoint = super.create();
    return endpoint.extend({
      fetch: async (params: any, body: any) => {
        // create has no parameters, but has a body with the id
        return { ...(await endpoint(params, body)), id: body.id };
      },
    });
  }
}
