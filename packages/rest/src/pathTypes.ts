type OnlyOptional<S extends string> = S extends `${infer K}?` ? K : never;
type OnlyRequired<S extends string> = S extends `${string}?` ? never : S;

/** Computes the union of keys for a path string */
export type PathKeys<S extends string> = string extends S
  ? string
  : S extends `${infer A}\\:${infer B}`
  ? PathKeys<A> | PathKeys<B>
  : S extends `${infer A}\\?${infer B}`
  ? PathKeys<A> | PathKeys<B>
  : PathSplits<S>;

type PathSplits<S extends string> = S extends `${string}:${infer K}/${infer R}`
  ? PathSplits<`:${K}`> | PathSplits<R>
  : S extends `${string}:${infer K}:${infer R}`
  ? PathSplits<`:${K}`> | PathSplits<`:${R}`>
  : S extends `${string}:${infer K}`
  ? K
  : never;

/** Parameters for a given path */
export type PathArgs<S extends string> = PathKeys<S> extends never
  ? // unknown is identity for intersection ('&')
    unknown
  : KeysToArgs<PathKeys<S>>;

export type KeysToArgs<Key extends string> = {
  [K in Key as OnlyOptional<K>]?: string | number;
} & {
  [K in Key as OnlyRequired<K>]: string | number;
};

export type PathArgsAndSearch<S extends string> = OnlyRequired<
  PathKeys<S>
> extends never
  ? Record<string, number | string | boolean> | undefined
  : {
      [K in PathKeys<S> as OnlyRequired<K>]: string | number;
    } & Record<string, number | string>;

/** Removes the last :token */
export type ShortenPath<S extends string> = string extends S
  ? string
  : S extends `${infer B}:${infer R}`
  ? TrimColon<`${B}:${ShortenPath<R>}`>
  : '';

type TrimColon<S extends string> = string extends S
  ? string
  : S extends `${infer R}:`
  ? R
  : S;
