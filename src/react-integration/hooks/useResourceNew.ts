import { ReadShape, Schema } from '~/resource';
import { Denormalized, DenormalizedNullable } from '~/resource/normal';
import useCacheNew from './useCacheNew';
import useRetrieve from './useRetrieve';
import useError from './useError';
import { useMemo } from 'react';

import hasUsableData from './hasUsableData';

type ResourceArgs<
  S extends Schema,
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void
> = [ReadShape<S, Params, Body>, Params | null];

/** single form resource */
function useOneResource<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(
  fetchShape: ReadShape<S, Params, Body>,
  params: Params | null,
): CondNull<typeof params, DenormalizedNullable<S>, Denormalized<S>> {
  const maybePromise = useRetrieve(fetchShape, params);
  // resource is null when it is not in cache or params is null
  const resource = useCacheNew(fetchShape, params);
  const error = useError(fetchShape, params, resource);

  if (!hasUsableData(resource, fetchShape) && maybePromise) throw maybePromise;
  if (error) throw error;

  return resource as any;
}

/** many form resource */
function useManyResources<A extends ResourceArgs<any, any, any>[]>(
  ...resourceList: A
) {
  const resources = resourceList.map(
    <
      Params extends Readonly<object>,
      Body extends Readonly<object | string> | void,
      S extends Schema
    >([fetchShape, params]: ResourceArgs<S, Params, Body>) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useCacheNew(fetchShape, params),
  );
  const promises = resourceList
    .map(([fetchShape, params]) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useRetrieve(fetchShape, params),
    )
    // only wait on promises without results
    .map((p, i) => !hasUsableData(resources[i], resourceList[i][0]) && p);

  // throw first valid error
  for (let i = 0; i < resourceList.length; i++) {
    const [fetchShape, params] = resourceList[i];
    const resource = resources[i];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const error = useError(fetchShape, params, resource);
    if (error && !promises[i]) throw error;
  }

  const promise = useMemo(() => {
    const activePromises = promises.filter(p => p);
    if (activePromises.length) {
      return Promise.all(activePromises);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, promises);

  if (promise) throw promise;

  return resources;
}

type CondNull<P, A, B> = P extends null ? A : B;

/** Ensure a resource is available; suspending to React until it is. */
export default function useResourceNew<
  P extends Readonly<object> | null,
  B extends Readonly<object | string> | void,
  S extends Schema
>(
  fetchShape: ReadShape<S, NonNullable<P>, B>,
  params: P,
): CondNull<P, DenormalizedNullable<S>, Denormalized<S>>;
export default function useResourceNew<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object | string> | void,
  S1 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
): [CondNull<P1, DenormalizedNullable<S1>, Denormalized<S1>>];
export default function useResourceNew<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object | string> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object | string> | void,
  S2 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
): [
  CondNull<P1, DenormalizedNullable<S1>, Denormalized<S1>>,
  CondNull<P2, DenormalizedNullable<S2>, Denormalized<S2>>,
];
export default function useResourceNew<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object | string> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object | string> | void,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  B3 extends Readonly<object | string> | void,
  S3 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
  v3: [ReadShape<S3, NonNullable<P3>, B3>, P3],
): [
  CondNull<P1, DenormalizedNullable<S1>, Denormalized<S1>>,
  CondNull<P2, DenormalizedNullable<S2>, Denormalized<S2>>,
  CondNull<P3, DenormalizedNullable<S3>, Denormalized<S3>>,
];
export default function useResourceNew<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object | string> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object | string> | void,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  B3 extends Readonly<object | string> | void,
  S3 extends Schema,
  P4 extends Readonly<object> | null,
  B4 extends Readonly<object | string> | void,
  S4 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
  v3: [ReadShape<S3, NonNullable<P3>, B3>, P3],
  v4: [ReadShape<S4, NonNullable<P4>, B4>, P4],
): [
  CondNull<P1, DenormalizedNullable<S1>, Denormalized<S1>>,
  CondNull<P2, DenormalizedNullable<S2>, Denormalized<S2>>,
  CondNull<P3, DenormalizedNullable<S3>, Denormalized<S3>>,
  CondNull<P4, DenormalizedNullable<S4>, Denormalized<S4>>,
];
export default function useResourceNew<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object | string> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object | string> | void,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  B3 extends Readonly<object | string> | void,
  S3 extends Schema,
  P4 extends Readonly<object> | null,
  B4 extends Readonly<object | string> | void,
  S4 extends Schema,
  P5 extends Readonly<object> | null,
  B5 extends Readonly<object | string> | void,
  S5 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
  v3: [ReadShape<S3, NonNullable<P3>, B3>, P3],
  v4: [ReadShape<S4, NonNullable<P4>, B4>, P4],
  v5: [ReadShape<S5, NonNullable<P5>, B5>, P5],
): [
  CondNull<P1, DenormalizedNullable<S1>, Denormalized<S1>>,
  CondNull<P2, DenormalizedNullable<S2>, Denormalized<S2>>,
  CondNull<P3, DenormalizedNullable<S3>, Denormalized<S3>>,
  CondNull<P4, DenormalizedNullable<S4>, Denormalized<S4>>,
  CondNull<P5, DenormalizedNullable<S5>, Denormalized<S5>>,
];
export default function useResourceNew<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(...args: ResourceArgs<S, Params, Body> | ResourceArgs<S, Params, Body>[]) {
  // this conditional use of hooks is ok as long as the structure of the arguments don't change
  if (Array.isArray(args[0])) {
    // TODO: provide type guard function to detect this
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useManyResources(...(args as ResourceArgs<S, Params, Body>[]));
  }
  args = args as ResourceArgs<S, Params, Body>;
  // TODO: make return types match up with the branching logic we put in here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useOneResource(args[0], args[1]);
}
