/* eslint-disable @typescript-eslint/ban-types */
import type {
  EndpointConstructor,
  ExtendableEndpointConstructor,
} from './endpointTypes.js';
export * from './endpointTypes.js';

declare let Endpoint: EndpointConstructor;

export default Endpoint;

export declare let ExtendableEndpoint: ExtendableEndpointConstructor;
