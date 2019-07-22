import { useMemo, useContext } from 'react';
import { ReadShape, Schema, SchemaOf } from '~/resource';
import { selectIsStale } from '~/state/selectors';
import { StateContext } from '~/react-integration/context';
import useCache from './useCache';
import useRetrieve from './useRetrieve';
import useError from './useError';

type ResourceArgs<
  S extends Schema,
  Params extends Readonly<object>,
  Body extends Readonly<object> | void
> = [ReadShape<S, Params, Body>, Params | null];

/** If the invalidIfStale option is set we suspend if resource has expired */
function useIsExpired<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(fetchShape: ReadShape<S, Params, Body>, params: Params | null): boolean {
  const state = useContext(StateContext);
  const fetchKey = params ? fetchShape.getFetchKey(params) : '';
  const isStale = selectIsStale(state, fetchKey);

  return Boolean(
    fetchShape.options && fetchShape.options.invalidIfStale && isStale,
  );
}

/** single form resource */
function useOneResource<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(fetchShape: ReadShape<S, Params, Body>, params: Params | null) {
  let maybePromise = useRetrieve(fetchShape, params);
  const resource = useCache(fetchShape, params);
  const isExpired = useIsExpired(fetchShape, params);
  const error = useError(fetchShape, params, resource);

  if (error && !isExpired) throw error;
  if (
    maybePromise &&
    typeof maybePromise.then === 'function' &&
    (!resource || isExpired)
  )
    throw maybePromise;

  return resource as NonNullable<typeof resource>;
}

/** many form resource */
function useManyResources<A extends ResourceArgs<any, any, any>[]>(
  ...resourceList: A
) {
  const resources = resourceList.map(
    <
      Params extends Readonly<object>,
      Body extends Readonly<object> | void,
      S extends Schema
    >([fetchShape, params]: ResourceArgs<S, Params, Body>) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useCache(fetchShape, params),
  );
  const isExpiredList = resourceList.map(([fetchShape, params]) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsExpired(fetchShape, params),
  );
  let promises = resourceList
    .map(([fetchShape, params]) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useRetrieve(fetchShape, params),
    )
    // only wait on promises without results
    .filter((p, i) => p && (!resources[i] || isExpiredList[i]));

  // get the first error that is valid.
  let error: null | Error = null;
  for (let i = 0; i < resourceList.length; i++) {
    const [fetchShape, params] = resourceList[i];
    const resource = resources[i];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const e = useError(fetchShape, params, resource);
    if (e && !isExpiredList[i]) error = e;
  }

  if (error) throw error;

  const promiseDeps = (promises as unknown[]).concat([promises.length]);

  const promise = useMemo(() => {
    if (promises.length) {
      return Promise.all(promises);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, promiseDeps);

  if (promise) throw promise;

  return resources;
}

type CondNull<P, R> = P extends null ? null : R;

/** Ensure a resource is available; suspending to React until it is. */
export default function useResource<
  P extends Readonly<object> | null,
  B extends Readonly<object> | void,
  S extends Schema
>(
  fetchShape: ReadShape<S, NonNullable<P>, B>,
  params: P,
): CondNull<P, SchemaOf<S>>;
export default function useResource<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object> | void,
  S1 extends Schema
>(v1: [ReadShape<S1, NonNullable<P1>, B1>, P1]): [CondNull<P1, SchemaOf<S1>>];
export default function useResource<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object> | void,
  S2 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
): [CondNull<P1, SchemaOf<S1>>, CondNull<P2, SchemaOf<S2>>];
export default function useResource<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object> | void,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  B3 extends Readonly<object> | void,
  S3 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
  v3: [ReadShape<S3, NonNullable<P3>, B3>, P3],
): [
  CondNull<P1, SchemaOf<S1>>,
  CondNull<P2, SchemaOf<S2>>,
  CondNull<P3, SchemaOf<S3>>,
];
export default function useResource<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object> | void,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  B3 extends Readonly<object> | void,
  S3 extends Schema,
  P4 extends Readonly<object> | null,
  B4 extends Readonly<object> | void,
  S4 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
  v3: [ReadShape<S3, NonNullable<P3>, B3>, P3],
  v4: [ReadShape<S4, NonNullable<P4>, B4>, P4],
): [
  CondNull<P1, SchemaOf<S1>>,
  CondNull<P2, SchemaOf<S2>>,
  CondNull<P3, SchemaOf<S3>>,
  CondNull<P4, SchemaOf<S4>>,
];
export default function useResource<
  P1 extends Readonly<object> | null,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object> | null,
  B2 extends Readonly<object> | void,
  S2 extends Schema,
  P3 extends Readonly<object> | null,
  B3 extends Readonly<object> | void,
  S3 extends Schema,
  P4 extends Readonly<object> | null,
  B4 extends Readonly<object> | void,
  S4 extends Schema,
  P5 extends Readonly<object> | null,
  B5 extends Readonly<object> | void,
  S5 extends Schema
>(
  v1: [ReadShape<S1, NonNullable<P1>, B1>, P1],
  v2: [ReadShape<S2, NonNullable<P2>, B2>, P2],
  v3: [ReadShape<S3, NonNullable<P3>, B3>, P3],
  v4: [ReadShape<S4, NonNullable<P4>, B4>, P4],
  v5: [ReadShape<S5, NonNullable<P5>, B5>, P5],
): [
  CondNull<P1, SchemaOf<S1>>,
  CondNull<P2, SchemaOf<S2>>,
  CondNull<P3, SchemaOf<S3>>,
  CondNull<P4, SchemaOf<S4>>,
  CondNull<P5, SchemaOf<S5>>,
];
export default function useResource<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
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
