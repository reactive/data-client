type CleanKey<S extends string> = S extends `"${infer K}"` ? K : S;

type KeyName<K extends string> = CleanKey<
  K extends `*${infer N}}` ? N
  : K extends `*${infer N}` ? N
  : K extends `${infer N}}` ? N
  : K
>;

type KeyVal<K extends string> =
  K extends `*${string}` ? string[] : string | number;

/** Parameters for a given path */
export type PathArgs<S extends string> =
  PathKeys<S> extends never ?
    // unknown is identity for intersection ('&')
    unknown
  : KeysToArgs<PathKeys<S>>;

/** Computes the union of keys for a path string */
export type PathKeys<S extends string> =
  string extends S ? string
  : S extends `${infer A}\\${':' | '*' | '}'}${infer B}` ?
    PathKeys<A> | PathKeys<B>
  : Splits<S, ':'> | Splits<S, '*'>;

type Splits<S extends string, M extends ':' | '*'> =
  S extends `${string}${M}${infer K}${M}${infer R}` ?
    Splits<`${M}${K}`, M> | Splits<`${M}${R}`, M>
  : S extends (
    `${string}${M}${infer K}${'/' | '\\' | '%' | '&' | '*' | ':' | '{' | ';' | ',' | '!' | '@'}${infer R}`
  ) ?
    Splits<`${M}${K}`, M> | Splits<R, M>
  : S extends `${string}${M}${infer K}` ?
    M extends '*' ?
      `*${K}`
    : K
  : never;

export type KeysToArgs<Key extends string> = {
  [K in Key as K extends `${string}}` ? KeyName<K> : never]?: KeyVal<K>;
} & (Exclude<Key, `${string}}`> extends never ? unknown
: {
    [K in Key as K extends `${string}}` ? never : KeyName<K>]: KeyVal<K>;
  });

export type PathArgsAndSearch<S extends string> =
  Exclude<PathKeys<S>, `${string}}`> extends never ?
    Record<string, number | string | boolean> | undefined
  : {
      [K in PathKeys<S> as K extends `${string}}` ? never
      : KeyName<K>]: KeyVal<K>;
    } & Record<string, number | string | string[]>;

/** Removes the last :param or *wildcard token */
export type ShortenPath<S extends string> =
  string extends S ? string
  : S extends `${infer B}:${infer R}` ? TrimToken<`${B}:${ShortenPath<R>}`>
  : S extends `${infer B}*${infer R}` ? TrimToken<`${B}*${ShortenPath<R>}`>
  : '';

type TrimToken<S extends string> =
  string extends S ? string
  : S extends `${infer R}:` ? R
  : S extends `${infer R}*` ? R
  : S;

export type ResourcePath = string; // `${string}:${string}`; TODO: Maybe do this in the future? Seems to hard to understand for now
