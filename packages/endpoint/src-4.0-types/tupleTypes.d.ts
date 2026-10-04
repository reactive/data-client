// Recursive conditional types need TypeScript 4.1, so these are approximated

export type PartialArray<A> = A extends any[] ? Partial<A> : never;

/** Removes Rem's length worth of leading elements from Orig (up to 3) */
export type RemoveArray<Orig extends any[], Rem extends any[]> =
  Rem extends [] ? Orig
  : Rem extends [any] ?
    Orig extends [any, ...infer R] ? R : never
  : Rem extends [any, any] ?
    Orig extends [any, any, ...infer R] ? R : never
  : Rem extends [any, any, any] ?
    Orig extends [any, any, any, ...infer R] ? R : never
  : any[];
