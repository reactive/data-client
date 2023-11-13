import type { FetchFunction, ResolveType } from '@data-client/endpoint';

import { PathArgs } from './pathTypes.js';
import { PartialRestGenerics, RestFetch } from './RestEndpoint.js';

export type OptionsToFunction<
  O extends PartialRestGenerics,
  E extends { body?: any; path?: string; method?: string },
  F extends FetchFunction,
> = 'path' extends keyof O ?
  RestFetch<
    'searchParams' extends keyof O ?
      O['searchParams'] & PathArgs<Exclude<O['path'], undefined>>
    : PathArgs<Exclude<O['path'], undefined>>,
    OptionsToBodyArgument<
      'body' extends keyof O ? O : E,
      'method' extends keyof O ? O['method'] : E['method']
    >,
    O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
  >
: 'body' extends keyof O ?
  RestFetch<
    'searchParams' extends keyof O ?
      O['searchParams'] & PathArgs<Exclude<E['path'], undefined>>
    : PathArgs<Exclude<E['path'], undefined>>,
    OptionsToBodyArgument<
      O,
      'method' extends keyof O ? O['method'] : E['method']
    >,
    O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
  >
: 'searchParams' extends keyof O ?
  RestFetch<
    O['searchParams'] & PathArgs<Exclude<E['path'], undefined>>,
    OptionsToBodyArgument<
      E,
      'method' extends keyof O ? O['method'] : E['method']
    >,
    O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
  >
: (
    this: ThisParameterType<F>,
    ...args: Parameters<F>
  ) => Promise<
    O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
  >;

export type OptionsToBodyArgument<
  O extends { body?: any },
  Method extends string | undefined,
> = Method extends 'POST' | 'PUT' | 'PATCH' | 'DELETE' ?
  'body' extends keyof O ?
    O['body']
  : any
: undefined;
