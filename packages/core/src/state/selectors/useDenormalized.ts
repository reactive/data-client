import { State } from '@rest-hooks/core/types';
import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { DenormalizeNullable } from '@rest-hooks/endpoint';
import { isEntity, Schema } from '@rest-hooks/endpoint';
import {
  DenormalizeCache,
  WeakListMap,
  denormalize,
  inferResults,
} from '@rest-hooks/normalizr';
import { useMemo } from 'react';
import useController from '@rest-hooks/core/react-integration/hooks/useController';
import shapeToEndpoint from '@rest-hooks/core/endpoint/adapter';

/**
 * Selects the denormalized form from `state` cache.
 *
 * If `result` is not found, will attempt to generate it naturally
 * using params and schema. This increases cache hit rate for many
 * detail shapes.
 *
 * @returns [denormalizedValue, ready]
 */
export default function useDenormalized<
  Shape extends Pick<
    ReadShape<Schema | undefined, any>,
    'getFetchKey' | 'schema' | 'options'
  >,
>(
  shape: Shape,
  params: ParamsFromShape<Shape> | null,
  state: State<any>,
  /** @deprecated */
  denormalizeCache?: any,
): [
  denormalized: DenormalizeNullable<Shape['schema']>,
  found: typeof params extends null ? false : boolean,
  deleted: boolean,
  expiresAt: number,
] {
  const controller = useController();

  const endpoint = useMemo(() => {
    return shapeToEndpoint(shape);
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = params !== null ? endpoint.key(params) : '';
  const cacheResults = params && state.results[key];

  // Compute denormalized value
  const { data, found, suspend, expiresAt } = useMemo(() => {
    return controller.getResponse(endpoint, params, state) as {
      data: DenormalizeNullable<Shape['schema']>;
      found: boolean;
      suspend: boolean;
      expiresAt: number;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cacheResults,
    state.indexes,
    state.entities,
    state.entityMeta,
    key,
    cacheResults,
  ]);
  return [data, found as any, suspend, expiresAt];
}
