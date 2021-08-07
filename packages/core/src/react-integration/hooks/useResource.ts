import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { Denormalize, DenormalizeNullable } from '@rest-hooks/endpoint';
import { useDenormalized } from '@rest-hooks/core/state/selectors/index';
import {
  DenormalizeCacheContext,
  StateContext,
} from '@rest-hooks/core/react-integration/context';
import { useMemo, useContext } from 'react';
import useRetrieve from '@rest-hooks/core/react-integration/hooks/useRetrieve';
import useError from '@rest-hooks/core/react-integration/hooks/useError';
import hasUsableData from '@rest-hooks/core/react-integration/hooks/hasUsableData';
import useMeta from '@rest-hooks/core/react-integration/hooks/useMeta';

type ResourceArgs<
  S extends ReadShape<any, any>,
  P extends ParamsFromShape<S> | null,
> = readonly [S, P];

/** single form resource */
function useOneResource<
  Shape extends ReadShape<any, any>,
  Params extends ParamsFromShape<Shape> | null,
>(
  fetchShape: Shape,
  params: Params,
): CondNull<
  Params,
  DenormalizeNullable<Shape['schema']>,
  Denormalize<Shape['schema']>
> {
  const state = useContext(StateContext);
  const denormalizeCache = useContext(DenormalizeCacheContext);
  const [denormalized, ready, deleted, entitiesExpireAt] = useDenormalized(
    fetchShape,
    params,
    state,
    denormalizeCache,
  );
  const error = useError(fetchShape, params);

  const maybePromise = useRetrieve(
    fetchShape,
    params,
    deleted && !error,
    entitiesExpireAt,
  );

  console.log('promise', maybePromise);
  if (
    !hasUsableData(
      fetchShape,
      ready,
      deleted,
      useMeta(fetchShape, params)?.invalidated,
    ) &&
    maybePromise
  ) {
    console.log('to thorw');
    throw maybePromise;
  }

  if (error) throw error;

  return denormalized as any;
}

/** many form resource */
function useManyResources<A extends ResourceArgs<any, any>[]>(
  ...resourceList: A
) {
  const state = useContext(StateContext);
  const denormalizeCache = useContext(DenormalizeCacheContext);
  const denormalizedValues = resourceList.map(
    <
      Shape extends ReadShape<any, any>,
      Params extends ParamsFromShape<Shape> | null,
    >([fetchShape, params]: ResourceArgs<Shape, Params>) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useDenormalized(fetchShape, params, state, denormalizeCache),
  );
  const errorValues = resourceList.map(
    <
      Shape extends ReadShape<any, any>,
      Params extends ParamsFromShape<Shape> | null,
    >(
      [fetchShape, params]: ResourceArgs<Shape, Params>,
      i: number,
    ) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useError(fetchShape, params),
  );
  const promises = resourceList
    .map(([fetchShape, params], i) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useRetrieve(
        fetchShape,
        params,
        denormalizedValues[i][2] && !errorValues[i],
        denormalizedValues[i][3],
      ),
    )
    // only wait on promises without results
    .map(
      (p, i) =>
        !hasUsableData(
          resourceList[i][0],
          denormalizedValues[i][1],
          denormalizedValues[i][2],
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useMeta(...resourceList[i])?.invalidated,
        ) && p,
    );

  // throw first valid error
  for (let i = 0; i < resourceList.length; i++) {
    const err = errorValues[i];
    // we aren't fetching at all
    // then throw that error
    if (err && !promises[i]) throw err;
  }
  const promise = useMemo(() => {
    const activePromises = promises.filter(p => p);
    if (activePromises.length) {
      return Promise.all(activePromises);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, promises);

  if (promise) throw promise;

  return denormalizedValues.map(([denormalized]) => denormalized);
}

type CondNull<P, A, B> = P extends null ? A : B;

/**
 * Ensure a resource is available.
 * Suspends until it is.
 *
 * `useResource` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useresource
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
>(
  v1: readonly [S1, P1],
): [CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
];

export default function useResource<
  S extends ReadShape<any, any>,
  P extends ParamsFromShape<S> | null,
>(
  fetchShape: S,
  params: P,
): CondNull<P, DenormalizeNullable<S['schema']>, Denormalize<S['schema']>>;

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
  CondNull<P10, DenormalizeNullable<S10['schema']>, Denormalize<S10['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
  CondNull<P10, DenormalizeNullable<S10['schema']>, Denormalize<S10['schema']>>,
  CondNull<P11, DenormalizeNullable<S11['schema']>, Denormalize<S11['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
  CondNull<P10, DenormalizeNullable<S10['schema']>, Denormalize<S10['schema']>>,
  CondNull<P11, DenormalizeNullable<S11['schema']>, Denormalize<S11['schema']>>,
  CondNull<P12, DenormalizeNullable<S12['schema']>, Denormalize<S12['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
  CondNull<P10, DenormalizeNullable<S10['schema']>, Denormalize<S10['schema']>>,
  CondNull<P11, DenormalizeNullable<S11['schema']>, Denormalize<S11['schema']>>,
  CondNull<P12, DenormalizeNullable<S12['schema']>, Denormalize<S12['schema']>>,
  CondNull<P13, DenormalizeNullable<S13['schema']>, Denormalize<S13['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
  S14 extends ReadShape<any, any>,
  P14 extends ParamsFromShape<S14> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
  v14: readonly [S14, P14],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
  CondNull<P10, DenormalizeNullable<S10['schema']>, Denormalize<S10['schema']>>,
  CondNull<P11, DenormalizeNullable<S11['schema']>, Denormalize<S11['schema']>>,
  CondNull<P12, DenormalizeNullable<S12['schema']>, Denormalize<S12['schema']>>,
  CondNull<P13, DenormalizeNullable<S13['schema']>, Denormalize<S13['schema']>>,
  CondNull<P14, DenormalizeNullable<S14['schema']>, Denormalize<S14['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
  S14 extends ReadShape<any, any>,
  P14 extends ParamsFromShape<S14> | null,
  S15 extends ReadShape<any, any>,
  P15 extends ParamsFromShape<S15> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
  v14: readonly [S14, P14],
  v15: readonly [S15, P15],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
  CondNull<P10, DenormalizeNullable<S10['schema']>, Denormalize<S10['schema']>>,
  CondNull<P11, DenormalizeNullable<S11['schema']>, Denormalize<S11['schema']>>,
  CondNull<P12, DenormalizeNullable<S12['schema']>, Denormalize<S12['schema']>>,
  CondNull<P13, DenormalizeNullable<S13['schema']>, Denormalize<S13['schema']>>,
  CondNull<P14, DenormalizeNullable<S14['schema']>, Denormalize<S14['schema']>>,
  CondNull<P15, DenormalizeNullable<S15['schema']>, Denormalize<S15['schema']>>,
];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
  S14 extends ReadShape<any, any>,
  P14 extends ParamsFromShape<S14> | null,
  S15 extends ReadShape<any, any>,
  P15 extends ParamsFromShape<S15> | null,
  S16 extends ReadShape<any, any>,
  P16 extends ParamsFromShape<S16> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
  v14: readonly [S14, P14],
  v15: readonly [S15, P15],
  v16: readonly [S16, P16],
): [
  CondNull<P1, DenormalizeNullable<S1['schema']>, Denormalize<S1['schema']>>,
  CondNull<P2, DenormalizeNullable<S2['schema']>, Denormalize<S2['schema']>>,
  CondNull<P3, DenormalizeNullable<S3['schema']>, Denormalize<S3['schema']>>,
  CondNull<P4, DenormalizeNullable<S4['schema']>, Denormalize<S4['schema']>>,
  CondNull<P5, DenormalizeNullable<S5['schema']>, Denormalize<S5['schema']>>,
  CondNull<P6, DenormalizeNullable<S6['schema']>, Denormalize<S6['schema']>>,
  CondNull<P7, DenormalizeNullable<S7['schema']>, Denormalize<S7['schema']>>,
  CondNull<P8, DenormalizeNullable<S8['schema']>, Denormalize<S8['schema']>>,
  CondNull<P9, DenormalizeNullable<S9['schema']>, Denormalize<S9['schema']>>,
  CondNull<P10, DenormalizeNullable<S10['schema']>, Denormalize<S10['schema']>>,
  CondNull<P11, DenormalizeNullable<S11['schema']>, Denormalize<S11['schema']>>,
  CondNull<P12, DenormalizeNullable<S12['schema']>, Denormalize<S12['schema']>>,
  CondNull<P13, DenormalizeNullable<S13['schema']>, Denormalize<S13['schema']>>,
  CondNull<P14, DenormalizeNullable<S14['schema']>, Denormalize<S14['schema']>>,
  CondNull<P15, DenormalizeNullable<S15['schema']>, Denormalize<S15['schema']>>,
  CondNull<P16, DenormalizeNullable<S16['schema']>, Denormalize<S16['schema']>>,
];
export default function useResource<
  Shape extends ReadShape<any, any>,
  Params extends ParamsFromShape<Shape> | null,
>(...args: ResourceArgs<Shape, Params> | ResourceArgs<Shape, Params>[]): any {
  // this conditional use of hooks is ok as long as the structure of the arguments don't change
  if (Array.isArray(args[0])) {
    // TODO: provide type guard function to detect this
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useManyResources(...(args as ResourceArgs<Shape, Params>[]));
  }
  args = args as ResourceArgs<Shape, Params>;
  // TODO: make return types match up with the branching logic we put in here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useOneResource(args[0], args[1]);
}
