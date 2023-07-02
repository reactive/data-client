import type {
  Normalize,
  EndpointInterface,
  ResolveType,
} from '@data-client/normalizr';

export type ResultEntry<E extends EndpointInterface> = E['schema'] extends
  | undefined
  | null
  ? ResolveType<E>
  : Normalize<E['schema']>;

export type EndpointUpdateFunction<
  Source extends EndpointInterface,
  Updaters extends Record<string, any> = Record<string, any>,
> = (
  source: ResultEntry<Source>,
  // this is hopeless because typescript doesn't think it should be contravariant
  ...args: any
) => {
  [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};
