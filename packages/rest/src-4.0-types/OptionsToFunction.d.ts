import type { FetchFunction, ResolveType } from '@data-client/endpoint';

import { PartialRestGenerics } from './RestEndpoint.js';

export type OptionsToFunction<
  O extends PartialRestGenerics,
  E extends { body?: any; path?: string; method?: string },
  F extends FetchFunction,
> = (
  this: ThisParameterType<F>,
  ...args: any
) => Promise<
  O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
>;

export type OptionsToBodyArgument<
  O extends { body?: any },
  Method extends string | undefined,
> = any;
