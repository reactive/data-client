declare type OnlyOptional<S extends string> = S extends `${infer K}?`
  ? K
  : never;
declare type OnlyRequired<S extends string> = S extends `${string}?`
  ? never
  : S;
/** Computes the union of keys for a path string */
export declare type PathKeys<S extends string> = string;

/** Parameters for a given path */
export declare type PathArgs<S extends string> = PathKeys<S> extends never
  ? unknown
  : KeysToArgs<PathKeys<S>>;
export declare type KeysToArgs<Key extends string> = {
  [K in Key as OnlyOptional<K>]?: string | number;
} & {
  [K in Key as OnlyRequired<K>]: string | number;
};
export declare type PathArgsAndSearch<S extends string> = OnlyRequired<
  PathKeys<S>
> extends never
  ? Record<string, number | string> | undefined
  : {
      [K in PathKeys<S> as OnlyRequired<K>]: string | number;
    } & Record<string, number | string>;
/** Removes the last :token */
export declare type ShortenPath<S extends string> = S;
export {};
//# sourceMappingURL=pathTypes.d.ts.map
