import type {
  Normalize,
  EndpointInterface,
  ResolveType,
} from '@rest-hooks/normalizr';

export type ResultEntry<E extends EndpointInterface> =
  E['schema'] extends undefined ? ResolveType<E> : Normalize<E>;

export type EndpointUpdateFunction<
  Source extends EndpointInterface,
  Updaters extends Record<string, any> = Record<string, any>,
> = (
  source: ResultEntry<Source>,
  ...args: Parameters<Source>
) => {
  [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};
