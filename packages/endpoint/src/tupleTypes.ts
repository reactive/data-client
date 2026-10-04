// Recursive conditional types need TypeScript 4.1; src-4.0-types overlays this file

export type PartialArray<A> =
  A extends [] ? []
  : A extends [infer F] ? [F] | []
  : A extends [infer F, ...infer Rest] ? [F] | [F, ...PartialArray<Rest>]
  : A extends (infer T)[] ? T[]
  : never;

/** Removes Rem's length worth of leading elements from Orig */
export type RemoveArray<Orig extends any[], Rem extends any[]> =
  Rem extends [any, ...infer RestRem] ?
    Orig extends [any, ...infer RestOrig] ?
      RemoveArray<RestOrig, RestRem>
    : never
  : Orig;
