import {
  Denormalize,
  DenormalizeNullable,
  ResolveType,
} from '@rest-hooks/normalizr';
import { useMemo, useContext } from 'react';
import { ExpiryStatus } from '@rest-hooks/normalizr';

import { ReadShape, ParamsFromShape } from '../../endpoint/index.js';
import { useDenormalized } from '../../state/selectors/index.js';
import { StateContext } from '../context.js';
import useRetrieve from './useRetrieve.js';
import useError from './useError.js';

type ResourceArgs<
  S extends ReadShape<any, any>,
  P extends ParamsFromShape<S> | null,
> = readonly [S, P];

type ResourceReturn<P, S extends { fetch: any; schema: any }> = CondNull<
  P,
  S['schema'] extends undefined
    ? ResolveType<S['fetch']> | undefined
    : DenormalizeNullable<S['schema']>,
  S['schema'] extends undefined
    ? ResolveType<S['fetch']>
    : Denormalize<S['schema']>
>;

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
  const { data, expiryStatus, expiresAt } = useDenormalized(
    fetchShape,
    params,
    state,
  );
  const error = useError(fetchShape, params);

  const maybePromise = useRetrieve(
    fetchShape,
    params,
    expiryStatus === ExpiryStatus.Invalid,
    expiresAt,
  );

  if (expiryStatus !== ExpiryStatus.Valid && maybePromise) {
    throw maybePromise;
  }

  if (error) throw error;

  return data as any;
}

/** many form resource */
function useManyResources<A extends ResourceArgs<any, any>[]>(
  ...resourceList: A
) {
  const state = useContext(StateContext);
  const denormalizedValues = resourceList.map(
    <
      Shape extends ReadShape<any, any>,
      Params extends ParamsFromShape<Shape> | null,
    >([fetchShape, params]: ResourceArgs<Shape, Params>) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useDenormalized(fetchShape, params, state),
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
        denormalizedValues[i].expiryStatus === ExpiryStatus.Invalid,
        denormalizedValues[i].expiresAt,
      ),
    )
    // only wait on promises without results
    .map(
      (p, i) => denormalizedValues[i].expiryStatus !== ExpiryStatus.Valid && p,
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

  return denormalizedValues.map(({ data }) => data);
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
>(v1: readonly [S1, P1]): [ResourceReturn<P1, S1>];

export default function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
): [ResourceReturn<P1, S1>, ResourceReturn<P2, S2>];

export default function useResource<
  S extends ReadShape<any, any>,
  P extends ParamsFromShape<S> | null,
>(fetchShape: S, params: P): ResourceReturn<P, S>;

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
): [ResourceReturn<P1, S1>, ResourceReturn<P2, S2>, ResourceReturn<P3, S3>];

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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
  ResourceReturn<P14, S14>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
  ResourceReturn<P14, S14>,
  ResourceReturn<P15, S15>,
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
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
  ResourceReturn<P14, S14>,
  ResourceReturn<P15, S15>,
  ResourceReturn<P16, S16>,
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
