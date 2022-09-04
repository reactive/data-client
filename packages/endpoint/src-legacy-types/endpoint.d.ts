/* eslint-disable @typescript-eslint/ban-types */
import { Schema, schema } from '@rest-hooks/normalizr';

import { EndpointInterface } from './interface.js';
import { EndpointExtraOptions, FetchFunction } from './types.js';
import { ResolveType } from './utility.js';
export interface EndpointOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = undefined,
  M extends true | undefined = undefined,
> extends EndpointExtraOptions<F> {
  key?: (...args: Parameters<F>) => string;
  sideEffect?: M;
  schema?: S;
  [k: string]: any;
}
export interface EndpointExtendOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointOptions<F, S, M> {
  fetch?: FetchFunction;
}
export type ParamFromFetch<F> = F extends (
  params: infer P,
  body?: any,
) => Promise<any>
  ? P
  : never;
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
export function Make(...args: any[]): EndpointInstance<FetchFunction>;
/**
 * Creates a new function.
 */
export interface EndpointInstance<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointInterface<
    F,
    S extends undefined ? schema.SchemaClass<ResolveType<F>> : S,
    M
  > {
  constructor: EndpointConstructor;
  /**
   * Calls the function, substituting the specified object for the this value of the function, and the specified array for the arguments of the function.
   * @param thisArg The object to be used as the this object.
   * @param argArray A set of arguments to be passed to the function.
   */
  apply(
    this: F,
    thisArg: ThisParameterType<F>,
    argArray?: Parameters<F>,
  ): ReturnType<F>;
  /**
   * Calls a method of an object, substituting another object for the current object.
   * @param thisArg The object to be used as the current object.
   * @param argArray A list of arguments to be passed to the method.
   */
  call(
    this: F,
    thisArg: ThisParameterType<F>,
    ...argArray: Parameters<F>
  ): ReturnType<F>;
  /**
   * For a given function, creates a bound function that has the same body as the original function.
   * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
   * @param thisArg An object to which the this keyword can refer inside the new function.
   * @param argArray A list of arguments to be passed to the new function.
   */
  bind<
    E extends EndpointInstance<
      FetchFunction,
      Schema | undefined,
      true | undefined
    >,
    P extends Parameters<F>,
  >(
    this: E,
    thisArg: ThisParameterType<E>,
    ...args: P
  ): EndpointInstance<() => ReturnType<E>, S, M> &
    Omit<E, keyof EndpointInstance<FetchFunction>>;

  /** Returns a string representation of a function. */
  toString(): string;
  prototype: any;
  readonly length: number;
  // Non-standard extensions
  arguments: any;
  caller: F;
  key(...args: Parameters<F>): string;
  readonly sideEffect: M;
  readonly schema: S;
  fetch: F;
  extend<
    E extends EndpointInstance<
      FetchFunction,
      Schema | undefined,
      true | undefined
    >,
    O extends EndpointExtendOptions<F> &
      Partial<Pick<E, Exclude<keyof E, keyof EndpointInstance<FetchFunction>>>>,
  >(
    this: E,
    options: O,
  ): Pick<O, Exclude<keyof O, keyof EndpointInstance<FetchFunction>>> &
    Pick<E, Exclude<keyof E, keyof EndpointInstance<FetchFunction>>> &
    EndpointInstance<
      'fetch' extends keyof typeof options
        ? Exclude<typeof options['fetch'], undefined>
        : E['fetch'],
      'schema' extends keyof typeof options
        ? typeof options['schema']
        : E['schema'],
      'sideEffect' extends keyof typeof options
        ? typeof options['sideEffect']
        : E['sideEffect']
    >;
  /** The following is for compatibility with FetchShape */
  /** @deprecated */
  readonly type: M extends undefined
    ? 'read'
    : IfAny<M, any, IfTypeScriptLooseNull<'read', 'mutate'>>;
  /** @deprecated */
  getFetchKey(params: Parameters<F>[0]): string;
  /** @deprecated */
  options?: EndpointExtraOptions<F>;
}
interface EndpointConstructor {
  new <
    F extends (
      this: EndpointInstance<FetchFunction> & E,
      params?: any,
      body?: any,
    ) => Promise<any>,
    S extends Schema | undefined = undefined,
    M extends true | undefined = undefined,
    E extends Record<string, any> = {},
  >(
    fetchFunction: F,
    options?: EndpointOptions<F, S, M> & E,
  ): EndpointInstance<F, S, M> & E;
  readonly prototype: Function;
}
declare let Endpoint: EndpointConstructor;
export default Endpoint;
type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
type IfTypeScriptLooseNull<Y, N> = 1 | undefined extends 1 ? Y : N;
