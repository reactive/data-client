import type { Schema } from '@data-client/endpoint';

import type { ResourcePath } from './pathTypes.js';
import RestEndpoint from './RestEndpoint.js';

export interface ResourceGenerics {
  /** @see https://resthooks.io/rest/api/createResource#path */
  readonly path: ResourcePath;
  /** @see https://resthooks.io/rest/api/createResource#schema */
  readonly schema: Schema;
  /** @see https://resthooks.io/rest/api/createResource#paginationfield */
  readonly paginationField?: string;
  /** Only used for types */
  /** @see https://dataclient.io/rest/api/createResource#body */
  readonly body?: any;
  /** Only used for types */
  /** @see https://resthooks.io/rest/api/createResource#searchParams */
  readonly searchParams?: any;
}
export interface ResourceOptions {
  /** @see https://resthooks.io/rest/api/createResource#endpoint */
  Endpoint?: typeof RestEndpoint;
  /** @see https://resthooks.io/rest/api/createResource#optimistic */
  optimistic?: boolean;
  /** @see https://resthooks.io/rest/api/createResource#urlprefix */
  urlPrefix?: string;
  requestInit?: RequestInit;
  getHeaders?(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;
  getRequestInit?(body: any): Promise<RequestInit> | RequestInit;
  fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
  parseResponse?(response: Response): Promise<any>;
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Determines whether to throw or fallback to */
  errorPolicy?(error: any): 'hard' | 'soft' | undefined;
}
