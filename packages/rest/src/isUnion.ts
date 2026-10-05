/** true when T is a union */
export type IsUnion<T, U = T> =
  T extends any ?
    [U] extends [T] ?
      false
    : true
  : never;
