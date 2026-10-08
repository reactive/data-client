import type { Fixture, Interceptor } from '@data-client/test';
import type { MouseEventHandler } from 'react';

export type FixtureOrInterceptor<T = any> = Fixture | Interceptor<T>;

export interface PreviewProps<T = any> {
  storeOpen: boolean;
  toggleStore: MouseEventHandler<HTMLDivElement>;
  row: boolean;
  /** Row layout: the layer over the code the Store slides into */
  storeHost: HTMLElement | null;
  fixtures: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
}
