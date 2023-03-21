import { EndpointInterface } from '@rest-hooks/endpoint';
export interface HookableEndpointInterface extends EndpointInterface {
  extend(...args: any): HookableEndpointInterface;
}
/** Turns a collection of Endpoints (Resource) into a collection of hooks.
 * This is useful for Endpoints that need hooks to prepare their fetch requests.
 *
 * Requires TypeScript 4.1 to be typed correctly
 *
 * @see https://resthooks.io/rest/api/hookifyResource
 */
export default function hookifyResource<R extends {}>(
  resource: R,
  useRequestInit: () => RequestInit,
): HookResource<R>;
export type HookResource<R extends Record<string, unknown>> = {
  [K: string]: () => R[string];
};
//# sourceMappingURL=hookifyResource.d.ts.map
