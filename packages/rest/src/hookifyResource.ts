import { EndpointInterface } from '@rest-hooks/endpoint';

export interface HookableEndpointInterface extends EndpointInterface {
  extend(...args: any): HookableEndpointInterface;
}

/** Turns a collection of Endpoints (Resource) into a collection of hooks.
 * This is useful for Endpoints that need hooks to prepare their fetch requests.
 *
 * @see https://resthooks.io/rest/api/hookifyResource
 */
export default function hookifyResource<
  R extends Record<string, HookableEndpointInterface>,
>(resource: R, useRequestInit: () => RequestInit): HookResource<R> {
  const usingResource: Record<string, () => HookableEndpointInterface> = {};
  Object.keys(resource).forEach(key => {
    usingResource[`use${capitalizeFirstLetter(key)}`] = () => {
      // this is false positive due to the dynamic nature of assignment
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const requestInit = useRequestInit();
      return resource[key].extend({ requestInit });
    };
  });
  return usingResource as any;
}

export type HookResource<R extends Record<string, HookableEndpointInterface>> =
  {
    [K in Extract<keyof R, string> as `use${Capitalize<K>}`]: () => R[K];
  };

function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
