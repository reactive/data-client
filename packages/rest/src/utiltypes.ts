/** Extracts only the keys that will be required
 *
 * Removes optional, as well as unbounded (aka 'string')
 *
 * @example
 ```
RequiredKeys<{
  opt?: string;
  bob: string;
  alice: number;
  [k: string]: string | number | undefined;
}> // = 'bob' | 'alice'
 ```
 */
export type RequiredKeys<T> = Values<OnlyRequired<T>>;

type OnlyRequired<T> = {
  [K in keyof T as string extends K ? never : K]-?: {} extends Pick<T, K>
    ? never
    : K;
};

type Values<T> = T[keyof T];
