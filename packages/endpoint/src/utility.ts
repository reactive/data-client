/** Get the Params type for a given Shape */
export type EndpointParam<E> = E extends (first: infer A, ...rest: any) => any
  ? A
  : E extends { key: (first: infer A, ...rest: any) => any }
  ? A
  : never;

/** What the function's promise resolves to */
export type ResolveType<E extends (...args: any) => any> =
  ReturnType<E> extends Promise<infer R> ? R : never;

export type PartialArray<A> = A extends []
  ? []
  : A extends [infer F]
  ? [F] | []
  : A extends [infer F, ...infer Rest]
  ? [F] | [F, ...PartialArray<Rest>]
  : A extends (infer T)[]
  ? T[]
  : never;
