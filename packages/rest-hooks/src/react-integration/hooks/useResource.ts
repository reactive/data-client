import { useMemo, useContext } from 'react';

import useRetrieve from './useRetrieve';
import useError from './useError';
import hasUsableData from './hasUsableData';

import {
  ReadShape,
  Schema,
  Denormalize,
  DenormalizeNullable,
} from '~/resource';
import { useDenormalized } from '~/state/selectors';
import { StateContext } from '~/react-integration/context';

type ResourceArgs<S extends Schema, Params extends Readonly<object>> = [
  ReadShape<S, Params>,
  Params | null,
];

/** single form resource */
function useOneResource<Params extends Readonly<object>, S extends Schema>(
  fetchShape: ReadShape<S, Params>,
  params: Params | null,
): CondNull<typeof params, DenormalizeNullable<S>, Denormalize<S>> {
  const maybePromise = useRetrieve(fetchShape, params);
  const state = useContext(StateContext);
  const [denormalized, ready] = useDenormalized(fetchShape, params, state);
  const error = useError(fetchShape, params, ready);

  if (!hasUsableData(ready, fetchShape) && maybePromise) throw maybePromise;
  if (error) throw error;

  return denormalized as any;
}

/** many form resource */
function useManyResources<A extends ResourceArgs<any, any>[]>(
  ...resourceList: A
) {
  const state = useContext(StateContext);
  const denormalizedValues = resourceList.map(
    <Params extends Readonly<object>, S extends Schema>([
      fetchShape,
      params,
    ]: ResourceArgs<S, Params>) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useDenormalized(fetchShape, params, state),
  );
  const promises = resourceList
    .map(([fetchShape, params]) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useRetrieve(fetchShape, params),
    )
    // only wait on promises without results
    .map(
      (p, i) =>
        !hasUsableData(denormalizedValues[i][1], resourceList[i][0]) && p,
    );

  // throw first valid error
  for (let i = 0; i < resourceList.length; i++) {
    const [fetchShape, params] = resourceList[i];
    const [_, ready] = denormalizedValues[i];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const error = useError(fetchShape, params, ready);
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

  return denormalizedValues.map(([denormalized]) => denormalized);
}

type CondNull<P, A, B> = P extends null ? A : B;

/** Ensure a resource is available; suspending to React until it is. */
export default function useResource<
  P extends Readonly<object> | null,
  B extends Readonly<object | string> | void,
  S extends Schema
>(
  fetchShape: ReadShape<S, NonNullable<P>>,
  params: P,
): CondNull<P, DenormalizeNullable<S>, Denormalize<S>>;
export default function useResource<
  P1 extends Readonly<object> | null,
  S1 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>>, P1],
): [CondNull<P1, DenormalizeNullable<S1>, Denormalize<S1>>];
export default function useResource<
  P1 extends Readonly<object> | null,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  S2 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>>, P1],
  v2: [ReadShape<S2, NonNullable<P2>>, P2],
): [
  CondNull<P1, DenormalizeNullable<S1>, Denormalize<S1>>,
  CondNull<P2, DenormalizeNullable<S2>, Denormalize<S2>>,
];
export default function useResource<
  P1 extends Readonly<object> | null,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  S3 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>>, P1],
  v2: [ReadShape<S2, NonNullable<P2>>, P2],
  v3: [ReadShape<S3, NonNullable<P3>>, P3],
): [
  CondNull<P1, DenormalizeNullable<S1>, Denormalize<S1>>,
  CondNull<P2, DenormalizeNullable<S2>, Denormalize<S2>>,
  CondNull<P3, DenormalizeNullable<S3>, Denormalize<S3>>,
];
export default function useResource<
  P1 extends Readonly<object> | null,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  S3 extends Schema,
  P4 extends Readonly<object> | null,
  S4 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>>, P1],
  v2: [ReadShape<S2, NonNullable<P2>>, P2],
  v3: [ReadShape<S3, NonNullable<P3>>, P3],
  v4: [ReadShape<S4, NonNullable<P4>>, P4],
): [
  CondNull<P1, DenormalizeNullable<S1>, Denormalize<S1>>,
  CondNull<P2, DenormalizeNullable<S2>, Denormalize<S2>>,
  CondNull<P3, DenormalizeNullable<S3>, Denormalize<S3>>,
  CondNull<P4, DenormalizeNullable<S4>, Denormalize<S4>>,
];
export default function useResource<
  P1 extends Readonly<object> | null,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  S3 extends Schema,
  P4 extends Readonly<object> | null,
  S4 extends Schema,
  P5 extends Readonly<object> | null,
  S5 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>>, P1],
  v2: [ReadShape<S2, NonNullable<P2>>, P2],
  v3: [ReadShape<S3, NonNullable<P3>>, P3],
  v4: [ReadShape<S4, NonNullable<P4>>, P4],
  v5: [ReadShape<S5, NonNullable<P5>>, P5],
): [
  CondNull<P1, DenormalizeNullable<S1>, Denormalize<S1>>,
  CondNull<P2, DenormalizeNullable<S2>, Denormalize<S2>>,
  CondNull<P3, DenormalizeNullable<S3>, Denormalize<S3>>,
  CondNull<P4, DenormalizeNullable<S4>, Denormalize<S4>>,
  CondNull<P5, DenormalizeNullable<S5>, Denormalize<S5>>,
];
export default function useResource<
  Params extends Readonly<object>,
  S extends Schema
>(...args: ResourceArgs<S, Params> | ResourceArgs<S, Params>[]): any {
  // this conditional use of hooks is ok as long as the structure of the arguments don't change
  if (Array.isArray(args[0])) {
    // TODO: provide type guard function to detect this
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useManyResources(...(args as ResourceArgs<S, Params>[]));
  }
  args = args as ResourceArgs<S, Params>;
  // TODO: make return types match up with the branching logic we put in here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useOneResource(args[0], args[1]);
}
