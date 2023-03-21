export type RequiredKeys<T> = Values<OnlyRequired<T>>;
type OnlyRequired<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
};
type Values<T> = T[keyof T];
