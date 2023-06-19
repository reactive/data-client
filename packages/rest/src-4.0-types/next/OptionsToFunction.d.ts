import type { FetchFunction, ResolveType } from '@data-client/endpoint';

import { PartialRestGenerics, RestInstance } from './RestEndpoint.js';

export type OptionsToFunction<
  O extends PartialRestGenerics,
  E extends RestInstance & {
    body?: any;
  },
  F extends FetchFunction,
> = (
  this: ThisParameterType<F>,
  ...args: any
) => Promise<
  O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
>;
