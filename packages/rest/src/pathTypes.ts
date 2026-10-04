// The non-`infer` pre-checks are matched without instantiating any types,
// so plain keys (the common case) skip the inferring templates entirely.
type CleanKey<S extends string> =
  S extends `"${string}"` ?
    S extends `"${infer K}"` ?
      K
    : S
  : S;

type KeyName<K extends string> =
  K extends `*${string}` | `${string}}` ?
    CleanKey<
      K extends `*${infer N}}` ? N
      : K extends `*${infer N}` ? N
      : K extends `${infer N}}` ? N
      : K
    >
  : CleanKey<K>;

type KeyVal<K extends string> =
  K extends `*${string}` ? string[] : string | number;

/** Parameters for a given path */
export type PathArgs<S extends string> =
  unknown extends S ? any
  : PathKeys<S> extends never ?
    // unknown is identity for intersection ('&')
    unknown
  : KeysToArgs<PathKeys<S>>;

/** Like {@link PathArgs} but widened `path: string` collapses to `unknown`,
 *  preventing `(params, body) | (body)` union overloads in ParamFetchWithBody. */
export type SoftPathArgs<P extends string> =
  unknown extends P ? any
  : string extends P ? unknown
  : PathArgs<P>;

/** Computes the union of keys for a path string */
export type PathKeys<S extends string> =
  string extends S ? string
  : // cheap (non-inferring) pre-check before the 3-way escape split
  S extends `${string}\\${string}` ?
    S extends `${infer A}\\${':' | '*' | '}'}${infer B}` ?
      PathKeys<A> | PathKeys<B>
    : ColonSplits<S> | StarSplits<S>
  : ColonSplits<S> | StarSplits<S>;

/** Characters that end a :param or *wildcard token */
type PathDelimiter =
  '/' | '\\' | '%' | '&' | '*' | ':' | '{' | ';' | ',' | '!' | '@';

/** Token after every ':' in S */
type ColonSplits<S extends string> =
  S extends `${string}:${infer K}` ? PathToken<K> | ColonSplits<K> : never;

/** `*`-prefixed token after every '*' in S */
type StarSplits<S extends string> =
  S extends `${string}*${infer K}` ? `*${PathToken<K>}` | StarSplits<K> : never;

/** Prefix of K up to (excluding) its first PathDelimiter.
 *
 * Fast path: no delimiter at all, or the first '/' ends a delimiter-free token.
 * The delimiter-union templates without `infer` are matched without instantiation. */
type PathToken<K extends string> =
  K extends `${string}${PathDelimiter}${string}` ?
    K extends `${infer H}/${string}` ?
      H extends `${string}${PathDelimiter}${string}` ?
        PathTokenSlow<H>
      : H
    : PathTokenSlow<K>
  : K;

/** Cuts at the first occurrence of each delimiter (union); recursing on each
 * candidate converges on the shortest, delimiter-free prefix. */
type PathTokenSlow<K extends string> =
  K extends `${infer H}${PathDelimiter}${string}` ? PathToken<H> : K;

export type KeysToArgs<Key extends string> = OptionalArgs<Key> &
  (RequiredPathKeys<Key> extends never ? unknown : RequiredArgs<Key>);

/** Wide keys (`string`, template patterns) keep the original key-remapping
 * form so index signatures (and their `keyof`) stay exactly the same. */
type HasWideKey<Key extends string> =
  true extends (
    Key extends string ?
      {} extends { [P in Key]: 1 } ?
        true
      : never
    : never
  ) ?
    true
  : false;

// Literal keys: mapped over the computed names without an `as` clause.
// `as` clauses get re-instantiated every time TypeScript asks whether the
// mapped type is generic (on every relation check of hook/fetch params).
// Each value is the KeyVal of the key(s) named N (inlined so errors show the
// resolved type rather than an alias).
type OptionalArgs<Key extends string> =
  HasWideKey<Key> extends true ?
    { [K in Key as K extends `${string}}` ? KeyName<K> : never]?: KeyVal<K> }
  : {
      [N in KeyName<OptionalPathKeys<Key>>]?:
        | (N extends KeyName<Extract<OptionalPathKeys<Key>, `*${string}`>> ?
            string[]
          : never)
        | (N extends KeyName<Exclude<OptionalPathKeys<Key>, `*${string}`>> ?
            string | number
          : never);
    };

type RequiredArgs<Key extends string> =
  HasWideKey<Key> extends true ?
    { [K in Key as K extends `${string}}` ? never : KeyName<K>]: KeyVal<K> }
  : {
      [N in KeyName<RequiredPathKeys<Key>>]:
        | (N extends KeyName<Extract<RequiredPathKeys<Key>, `*${string}`>> ?
            string[]
          : never)
        | (N extends KeyName<Exclude<RequiredPathKeys<Key>, `*${string}`>> ?
            string | number
          : never);
    };

type OptionalPathKeys<Key extends string> = Extract<Key, `${string}}`>;
type RequiredPathKeys<Key extends string> = Exclude<Key, `${string}}`>;

export type PathArgsAndSearch<S extends string> =
  unknown extends S ? any
  : Exclude<PathKeys<S>, `${string}}`> extends never ?
    Record<string, number | string | boolean> | undefined
  : {
      [
        K in PathKeys<S> as K extends `${string}}` ? never : KeyName<K>
      ]: KeyVal<K>;
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
