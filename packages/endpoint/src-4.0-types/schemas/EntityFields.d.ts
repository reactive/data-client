/** Attempts to infer reasonable input type to construct an Entity */
export type EntityFields<U> = {
  readonly [K in keyof U]?: U[K] extends number ? U[K] | string
  : U[K] extends string ? U[K] | number
  : U[K];
};
