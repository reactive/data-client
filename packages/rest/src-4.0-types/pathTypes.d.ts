/** Computes the union of keys for a path string */
export declare type PathKeys<S extends string> = string;

/** Parameters for a given path */
export declare type PathArgs<S extends string> = PathKeys<S> extends never
  ? unknown
  : KeysToArgs<PathKeys<S>>;

export declare type KeysToArgs<Key extends string> = {
  [K in Key]?: string | number;
};
export declare type PathArgsAndSearch<S extends string> =
  PathKeys<S> extends never
    ? Record<string, number | string> | undefined
    : {
        [K in PathKeys<S>]: string | number;
      } & Record<string, number | string>;

/** Removes the last :token */
export declare type ShortenPath<S extends string> = S;
