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

// exclude number only required for typescript 4.4 and below
// https://www.typescriptlang.org/play?ts=4.4.4#code/C4TwDgpgBAglC8UDeUBGB7VAuKBnYATgJYB2A5gNxQDaA1jvseQLo4CsAPo6WVAL4UAsACgRIiAA8w6AsCihIUAEoQAjgFciBCABMA0hBC4APABUAfAigA1AIYAbdRBMB5EvZAqNW3WfPmhUWFJaVl5cGg3Dy9NbR0-KyQRKBo9KFIoWkN0ADMoUyhbXDxCHihJYAgSHWK0gH4oEggANwgCKBw9ZgBaOpwkPnKJSurigAUiAGNaMwAaKD1zZJSoBqbWgmWUzsCBMWEFaDtHZwTEUzpsvNNmQJFDqABhKyjPNVjfGCWDiKgAIT+ViyIFyT3uv0ez0QxycJke5iAA
type Values<T> = T[Exclude<keyof T, number>];
