/* eslint-disable @typescript-eslint/ban-types */
import type { RestEndpointConstructor } from './RestEndpointTypes.js';
export * from './RestEndpointTypes.js';

/** Simplifies endpoint definitions that follow REST patterns
 *
 * @see https://resthooks.io/rest/api/RestEndpoint
 */
export declare let RestEndpoint: RestEndpointConstructor;
export default RestEndpoint;
