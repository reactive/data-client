type OCleanKey<S extends string> = S extends `"${infer K}"` ? K : S;

type OKeyName<K extends string> = OCleanKey<
  K extends `*${infer N}}` ? N
  : K extends `*${infer N}` ? N
  : K extends `${infer N}}` ? N
  : K
>;

type OKeyVal<K extends string> =
  K extends `*${string}` ? string[] : string | number;

/** Parameters for a given path */
type OPathArgs<S extends string> =
  unknown extends S ? any
  : OPathKeys<S> extends never ?
    // unknown is identity for intersection ('&')
    unknown
  : OKeysToArgs<OPathKeys<S>>;

/** Like {@link PathArgs} but widened `path: string` collapses to `unknown`,
 *  preventing `(params, body) | (body)` union overloads in ParamFetchWithBody. */
type OSoftPathArgs<P extends string> =
  unknown extends P ? any
  : string extends P ? unknown
  : OPathArgs<P>;

/** Computes the union of keys for a path string */
type OPathKeys<S extends string> =
  string extends S ? string
  : S extends `${infer A}\\${':' | '*' | '}'}${infer B}` ?
    OPathKeys<A> | OPathKeys<B>
  : OSplits<S, ':'> | OSplits<S, '*'>;

type OSplits<S extends string, M extends ':' | '*'> =
  S extends `${string}${M}${infer K}${M}${infer R}` ?
    OSplits<`${M}${K}`, M> | OSplits<`${M}${R}`, M>
  : S extends (
    `${string}${M}${infer K}${'/' | '\\' | '%' | '&' | '*' | ':' | '{' | ';' | ',' | '!' | '@'}${infer R}`
  ) ?
    OSplits<`${M}${K}`, M> | OSplits<R, M>
  : S extends `${string}${M}${infer K}` ?
    M extends '*' ?
      `*${K}`
    : K
  : never;

type OKeysToArgs<Key extends string> = {
  [K in Key as K extends `${string}}` ? OKeyName<K> : never]?: OKeyVal<K>;
} & (Exclude<Key, `${string}}`> extends never ? unknown
: {
    [K in Key as K extends `${string}}` ? never : OKeyName<K>]: OKeyVal<K>;
  });

type OPathArgsAndSearch<S extends string> =
  unknown extends S ? any
  : Exclude<OPathKeys<S>, `${string}}`> extends never ?
    Record<string, number | string | boolean> | undefined
  : {
      [
        K in OPathKeys<S> as K extends `${string}}` ? never : OKeyName<K>
      ]: OKeyVal<K>;
    } & Record<string, number | string | string[]>;

/** Removes the last :param or *wildcard token */
type OShortenPath<S extends string> =
  string extends S ? string
  : S extends `${infer B}:${infer R}` ? OTrimToken<`${B}:${OShortenPath<R>}`>
  : S extends `${infer B}*${infer R}` ? OTrimToken<`${B}*${OShortenPath<R>}`>
  : '';

type OTrimToken<S extends string> =
  string extends S ? string
  : S extends `${infer R}:` ? R
  : S extends `${infer R}*` ? R
  : S;

type OResourcePath = string; // `${string}:${string}`; TODO: Maybe do this in the future? Seems to hard to understand for now
