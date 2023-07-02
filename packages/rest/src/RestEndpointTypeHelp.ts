import type {
  FetchFunction,
  ResolveType,
  Normalize,
} from '@data-client/endpoint';

export type EndpointUpdateFunction<
  Source extends FetchFunction,
  Schema,
  Updaters extends Record<string, any> = Record<string, any>,
> = (
  source: ResultEntry<Source & { schema: Schema }>,
  ...args: Parameters<Source>
) => {
  [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};
export type ResultEntry<E extends FetchFunction & { schema: any }> =
  E['schema'] extends undefined | null
    ? ResolveType<E>
    : Normalize<E['schema']>;
