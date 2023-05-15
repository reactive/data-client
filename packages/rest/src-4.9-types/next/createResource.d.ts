import type {
  Resource,
  ResourceEndpointExtensions,
  ResourceGenerics,
  ResourceOptions,
  ExtendedResource,
} from './resourceTypes.js';
import { PartialRestGenerics, RestEndpointOptions } from './RestEndpoint.js';
/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
export default function createResource<
  O extends ResourceGenerics,
  Get extends PartialRestGenerics = any,
  GetList extends PartialRestGenerics = any,
  Update extends PartialRestGenerics = any,
  PartialUpdate extends PartialRestGenerics = any,
  Create extends PartialRestGenerics = any,
  Delete extends PartialRestGenerics = any,
  E extends Record<string, PartialRestGenerics & RestEndpointOptions> = {},
>(
  options: Readonly<O> &
    ResourceOptions &
    ResourceEndpointExtensions<
      Resource<O>,
      Get,
      GetList,
      Update,
      PartialUpdate,
      Create,
      Delete
    >,
): ExtendedResource<
  Resource<O>,
  Get,
  GetList,
  Update,
  PartialUpdate,
  Create,
  Delete,
  E
>;
//# sourceMappingURL=createResource.d.ts.map
