import {
  RequestShape,
  SelectReturn,
  AlwaysSelect,
  ParamArg,
} from '../../resource';
import useSelect from './useSelect';
import useFetch from './useFetch';
import useMeta from './useMeta';

/** Access a resource or error if failed to get it */
function useError<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>(selectShape: S, params: ParamArg<S> | null, resource: SelectReturn<S>) {
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
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
> = [S, ParamArg<S> | null];

/** single form resource */
function useOneResource<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>(selectShape: S, params: ParamArg<S> | null) {
  let maybePromise = useFetch(selectShape, params);
  const resource = useSelect(selectShape, params);

  if (!resource && maybePromise && typeof maybePromise.then === 'function')
    throw maybePromise;
  useError(selectShape, params, resource);

  return resource;
}

/** many form resource */
function useManyResources<A extends ResourceArgs<any, any, any>[]>(
  ...resourceList: A
) {
  let promises = resourceList.map(([select, params]) =>
    useFetch(select, params)
  );
  const resources = resourceList.map(
    <S extends RequestShape<P1, P2>, P1 extends object, P2 extends object>([
      select,
      params,
    ]: ResourceArgs<S, P1, P2>) => useSelect(select, params)
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
  S extends RequestShape<P1, P2>,
  P1 extends object,
  P2 extends object
>(selectShape: S, params: ParamArg<S> | null): AlwaysSelect<S>;
export default function useResource<
  S1 extends RequestShape<X, Y>,
  X extends object,
  Y extends object
>(v1: [S1, ParamArg<S1> | null]): [AlwaysSelect<S1>];
export default function useResource<
  S1 extends RequestShape<X1, Y1>,
  X1 extends object,
  Y1 extends object,
  S2 extends RequestShape<X2, Y2>,
  X2 extends object,
  Y2 extends object
>(
  v1: [S1, ParamArg<S1> | null],
  v2: [S2, ParamArg<S2> | null]
): [AlwaysSelect<S1>, AlwaysSelect<S2>];
export default function useResource<
  S1 extends RequestShape<X1, Y1>,
  X1 extends object,
  Y1 extends object,
  S2 extends RequestShape<X2, Y2>,
  X2 extends object,
  Y2 extends object,
  S3 extends RequestShape<X3, Y3>,
  X3 extends object,
  Y3 extends object
>(
  v1: [S1, ParamArg<S1> | null],
  v2: [S2, ParamArg<S2> | null],
  v3: [S3, ParamArg<S3> | null]
): [AlwaysSelect<S1>, AlwaysSelect<S2>, AlwaysSelect<S3>];
export default function useResource<
  S1 extends RequestShape<X1, Y1>,
  X1 extends object,
  Y1 extends object,
  S2 extends RequestShape<X2, Y2>,
  X2 extends object,
  Y2 extends object,
  S3 extends RequestShape<X3, Y3>,
  X3 extends object,
  Y3 extends object,
  S4 extends RequestShape<X4, Y4>,
  X4 extends object,
  Y4 extends object
>(
  v1: [S1, ParamArg<S1> | null],
  v2: [S2, ParamArg<S2> | null],
  v3: [S3, ParamArg<S3> | null],
  v4: [S4, ParamArg<S4> | null]
): [AlwaysSelect<S1>, AlwaysSelect<S2>, AlwaysSelect<S3>, AlwaysSelect<S4>];
export default function useResource<
  S1 extends RequestShape<X1, Y1>,
  X1 extends object,
  Y1 extends object,
  S2 extends RequestShape<X2, Y2>,
  X2 extends object,
  Y2 extends object,
  S3 extends RequestShape<X3, Y3>,
  X3 extends object,
  Y3 extends object,
  S4 extends RequestShape<X4, Y4>,
  X4 extends object,
  Y4 extends object,
  S5 extends RequestShape<X5, Y5>,
  X5 extends object,
  Y5 extends object
>(
  v1: [S1, ParamArg<S1> | null],
  v2: [S2, ParamArg<S2> | null],
  v3: [S3, ParamArg<S3> | null],
  v4: [S4, ParamArg<S4> | null],
  v5: [S5, ParamArg<S5> | null]
): [
  AlwaysSelect<S1>,
  AlwaysSelect<S2>,
  AlwaysSelect<S3>,
  AlwaysSelect<S4>,
  AlwaysSelect<S5>
];
export default function useResource<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>(...args: ResourceArgs<S, P1, P2> | ResourceArgs<S, P1, P2>[]) {
  // this conditional use of hooks is ok as long as the structure of the arguments don't change
  if (Array.isArray(args[0])) {
    // TODO: provide type guard function to detect this
    return useManyResources(...(args as ResourceArgs<S, P1, P2>[]));
  }
  args = args as ResourceArgs<S, P1, P2>;
  // TODO: make return types match up with the branching logic we put in here.
  return useOneResource(args[0], args[1]);
}
