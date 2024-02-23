/** Attempts to infer reasonable input type to construct an Entity */
export type EntityFields<U> = {
  readonly [K in keyof U as U[K] extends (...args: any) => any ? never
  : K]?: U[K] extends number ? U[K] | string
  : U[K] extends string ? U[K] | number
  : U[K];
};

// this mapping is introduced in 4.1: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#key-remapping-in-mapped-types
