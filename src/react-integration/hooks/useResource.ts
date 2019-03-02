import {
  ReadShape,
  Schema,
  RequestResource,
  SchemaOf,
} from '../../resource';
import useCache from './useCache';
import useRetrieve from './useRetrieve';
import useMeta from './useMeta';

/** Access a resource or error if failed to get it */
function useError<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
>(selectShape: ReadShape<Params, Body, S>, params: Params | null, resource: RequestResource<typeof selectShape> | null) {
  const meta = useMeta(selectShape, params);
  if (!resource) {
    if(!meta) return;
    if (!meta.error) {
      throw Error(`Resource not found when it should be ${params}`);
    } else {
      throw meta.error;
    }
  }
}

type ResourceArgs<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema,
> = [ReadShape<Params, Body, S>, Params | null];

/** single form resource */
function useOneResource<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema,
>(selectShape: ReadShape<Params, Body, S>, params: Params | null) {
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
    useRetrieve(select, params)
  );
  const resources = resourceList.map(
    <Params extends Readonly<object>,
    Body extends Readonly<object> | void,
    S extends Schema>([
      select,
      params,
    ]: ResourceArgs<Params, Body, S>) => useCache(select, params)
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
>(selectShape: ReadShape<P, B, S>, params: P | null): SchemaOf<S>;
export default function useResource<
  P1 extends Readonly<object>,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
>(v1: [ReadShape<P1, B1, S1>, P1 | null]): [SchemaOf<S1>];
export default function useResource<
  P1 extends Readonly<object>,
  B1 extends Readonly<object> | void,
  S1 extends Schema,
  P2 extends Readonly<object>,
  B2 extends Readonly<object> | void,
  S2 extends Schema,
>(
  v1: [ReadShape<P1, B1, S1>, P1 | null],
  v2: [ReadShape<P2, B2, S2>, P2 | null],
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
  S3 extends Schema,
>(
  v1: [ReadShape<P1, B1, S1>, P1 | null],
  v2: [ReadShape<P2, B2, S2>, P2 | null],
  v3: [ReadShape<P3, B3, S3>, P3 | null],
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
  S4 extends Schema,
>(
  v1: [ReadShape<P1, B1, S1>, P1 | null],
  v2: [ReadShape<P2, B2, S2>, P2 | null],
  v3: [ReadShape<P3, B3, S3>, P3 | null],
  v4: [ReadShape<P4, B4, S4>, P4 | null],
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
  S5 extends Schema,
>(
  v1: [ReadShape<P1, B1, S1>, P1 | null],
  v2: [ReadShape<P2, B2, S2>, P2 | null],
  v3: [ReadShape<P3, B3, S3>, P3 | null],
  v4: [ReadShape<P4, B4, S4>, P4 | null],
  v5: [ReadShape<P5, B5, S5>, P5 | null],
): [SchemaOf<S1>, SchemaOf<S2>, SchemaOf<S3>, SchemaOf<S4>, SchemaOf<S5>];
export default function useResource<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema,
>(...args: ResourceArgs<Params, Body, S> | ResourceArgs<Params, Body, S>[]) {
  // this conditional use of hooks is ok as long as the structure of the arguments don't change
  if (Array.isArray(args[0])) {
    // TODO: provide type guard function to detect this
    return useManyResources(...(args as ResourceArgs<Params, Body, S>[]));
  }
  args = args as ResourceArgs<Params, Body, S>;
  // TODO: make return types match up with the branching logic we put in here.
  return useOneResource(args[0], args[1]);
}
