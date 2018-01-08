import { Resource, RequestShape } from './resource';
import NetworkManager from './state/NetworkManager';
import {
  RestProvider,
  hooks,
  NetworkErrorBoundary,
} from './react-integration';
import * as selectors from './state/selectors';
import { Request as RequestType } from 'superagent';

// this is required so babel doesn't put the export in the JS code
export type RequestShape<
Param extends object,
Payload extends object | void
> = RequestShape<Param, Payload>;
export type Request = RequestType;
export {
  Resource,
  RestProvider,
  hooks,
  selectors,
  NetworkManager,
  NetworkErrorBoundary,
};
