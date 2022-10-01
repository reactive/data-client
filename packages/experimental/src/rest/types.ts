/*export type Paginatable<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    true | undefined
  >,
> = E & {
  paginated<T extends E>(this: T, removeCursor: (...args: any) => any[]): T;
};*/

type OnlyOptional<S extends string> = S extends `${infer K}?` ? K : never;
type OnlyRequired<S extends string> = S extends `${string}?` ? never : S;

export type PathKeys<S extends string> = string extends S
  ? string
  : S extends `${infer A}\\:${infer B}`
  ? PathKeys<A> | PathKeys<B>
  : S extends `${string}:${infer K}/${infer R}`
  ? RemoveEscapes<K> | PathKeys<R>
  : S extends `${string}:${infer K}`
  ? RemoveEscapes<K>
  : never;

type RemoveEscapes<S extends string> = S extends `${infer K}\\?${string}`
  ? K
  : S;

/** Parameters for a given path */
export type PathArgs<S extends string> = {
  [K in PathKeys<S> as OnlyOptional<K>]?: string | number;
} & {
  [K in PathKeys<S> as OnlyRequired<K>]: string | number;
};

export type PathArgsAndSearch<S extends string> = {
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
