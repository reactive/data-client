import { ReadShape, Schema, RequestResource, SchemaOf } from '../../resource';
import useCache from './useCache';
import useRetrieve from './useRetrieve';
import useError from './useError';

type ResourceArgs<
  S extends Schema,
  Params extends Readonly<object>,
  Body extends Readonly<object> | void
> = [ReadShape<S, Params, Body>, Params | null];

/** single form resource */
function useOneResource<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(selectShape: ReadShape<S, Params, Body>, params: Params | null) {
  let maybePromise = useRetrieve(selectShape, params);
  const resource = useCache(selectShape, params);

  if (!resource && maybePromise && typeof maybePromise.then === 'function')
    throw maybePromise;
  useError(selectShape, params, resource);

  return resource as NonNullable<typeof resource>;
}

/** many form resource */
function useManyResources<A extends ResourceArgs<any, any, any>[]>(
  ...resourceList: A
) {
  let promises = resourceList.map(([select, params]) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRetrieve(select, params),
  );
  const resources = resourceList.map(
    <
      Params extends Readonly<object>,
      Body extends Readonly<object> | void,
      S extends Schema
    >([select, params]: ResourceArgs<S, Params, Body>) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useCache(select, params),
  );
  // only wait on promises without results
  promises = promises.filter((p, i) => p && !resources[i]);
  if (promises.length) {
    throw Promise.all(promises);
  }
  return resources;
}

/** Ensure a resource is available; suspending to React until it is. */
export default function useResource<
  P extends Readonly<object>,
  B extends Readonly<object> | void,
  S extends Schema
>(selectShape: ReadShape<S, P, B>, params: P | null): SchemaOf<S>;
export default function useResource<
  P1 extends Readonly<object>,
  B1 extends Readonly<object> | void,
  S1 extends Schema
>(v1: [ReadShape<S1, P1, B1>, P1 | null]): [SchemaOf<S1>];
export default function useResource<
  P1 extends Readonly<object>,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object>,
  B2 extends Readonly<object> | void,
  S2 extends Schema
>(
  v1: [ReadShape<S1, P1, B1>, P1 | null],
  v2: [ReadShape<S2, P2, B2>, P2 | null],
): [SchemaOf<S1>, SchemaOf<S2>];
export default function useResource<
  P1 extends Readonly<object>,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object>,
  B2 extends Readonly<object> | void,
  S2 extends Schema,
  P3 extends Readonly<object>,
  B3 extends Readonly<object> | void,
  S3 extends Schema
>(
  v1: [ReadShape<S1, P1, B1>, P1 | null],
  v2: [ReadShape<S2, P2, B2>, P2 | null],
  v3: [ReadShape<S3, P3, B3>, P3 | null],
): [SchemaOf<S1>, SchemaOf<S2>, SchemaOf<S3>];
export default function useResource<
  P1 extends Readonly<object>,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object>,
  B2 extends Readonly<object> | void,
  S2 extends Schema,
  P3 extends Readonly<object>,
  B3 extends Readonly<object> | void,
  S3 extends Schema,
  P4 extends Readonly<object>,
  B4 extends Readonly<object> | void,
  S4 extends Schema
>(
  v1: [ReadShape<S1, P1, B1>, P1 | null],
  v2: [ReadShape<S2, P2, B2>, P2 | null],
  v3: [ReadShape<S3, P3, B3>, P3 | null],
  v4: [ReadShape<S4, P4, B4>, P4 | null],
): [SchemaOf<S1>, SchemaOf<S2>, SchemaOf<S3>, SchemaOf<S4>];
export default function useResource<
  P1 extends Readonly<object>,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object>,
  B2 extends Readonly<object> | void,
  S2 extends Schema,
  P3 extends Readonly<object>,
  B3 extends Readonly<object> | void,
  S3 extends Schema,
  P4 extends Readonly<object>,
  B4 extends Readonly<object> | void,
  S4 extends Schema,
  P5 extends Readonly<object>,
  B5 extends Readonly<object> | void,
  S5 extends Schema
>(
  v1: [ReadShape<S1, P1, B1>, P1 | null],
  v2: [ReadShape<S2, P2, B2>, P2 | null],
  v3: [ReadShape<S3, P3, B3>, P3 | null],
  v4: [ReadShape<S4, P4, B4>, P4 | null],
  v5: [ReadShape<S5, P5, B5>, P5 | null],
): [SchemaOf<S1>, SchemaOf<S2>, SchemaOf<S3>, SchemaOf<S4>, SchemaOf<S5>];
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
