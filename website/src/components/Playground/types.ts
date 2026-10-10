import type { Fixture, Interceptor } from '@data-client/test';
import type { MouseEventHandler } from 'react';

export type FixtureOrInterceptor<T = any> = Fixture | Interceptor<T>;

export interface PreviewProps<T = any> {
  /** Remembers this Playground's Store choices (open, its tab) */
  groupId: string;
  storeOpen: boolean;
  toggleStore: MouseEventHandler<HTMLElement>;
  row: boolean;
  /** Row layout: the layer over the code the Store slides into */
  storeHost: HTMLElement | null;
  fixtures: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
}
