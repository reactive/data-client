import { EndpointInterface, EndpointParam } from '@rest-hooks/endpoint';

/**
 * Keeps value updated after delay time
 *
 * @see https://resthooks.io/docs/api/useDebounce
 * @param value Any immutable value
 * @param delay Time in miliseconds to wait til updating the value
 * @param updatable Whether to update at all
 * @example
 ```
 const debouncedFilter = useDebounced(filter, 200);
 const list = useResource(ListShape, { filter });
 ```
 */
declare function useDebounce<T>(value: T, delay: number, updatable?: boolean): T;

/**
 * Builds an Endpoint that cancels fetch everytime params change
 *
 * @see https://resthooks.io/docs/api/useCancelling
 * @example
 ```
 useResource(useCancelling(MyEndpoint, { id }), { id })
 ```
 */
declare function useCancelling<E extends EndpointInterface & {
    extend: (o: {
        signal?: AbortSignal | undefined;
    }) => any;
}>(endpoint: E, params: EndpointParam<E> | null): E;

/**
 * Takes an async function and tracks resolution as a boolean.
 *
 * @see https://resthooks.io/docs/api/useLoading
 * @param func A function returning a promise
 * @param deps Deps list sent to useCallback()
 * @example
 ```
 function Button({ onClick, children, ...props }) {
   const [clickHandler, loading] = useLoading(onClick);
   return (
     <button onClick={clickHandler} {...props}>
       {loading ? 'Loading...' : children}
     </button>
   );
 }
 ```
 */
declare function useLoading<F extends (...args: any) => Promise<any>>(func: F, deps?: readonly any[]): [F, boolean, Error | undefined];

export { useCancelling, useDebounce, useLoading };
