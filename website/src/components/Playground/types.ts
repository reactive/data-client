import type { Fixture, Interceptor } from '@data-client/test';
import type { MouseEventHandler, ReactNode } from 'react';

export type FixtureOrInterceptor<T = any> = Fixture | Interceptor<T>;

/** The demo layout's code, as the preview's header shows it (../index.tsx) */
export interface CodeControl {
  /** The code shows in the result's place */
  shown: boolean;
  /** The header's Code toggle */
  toggle: ReactNode;
}

export interface PreviewProps<T = any> {
  storeOpen: boolean;
  toggleStore: MouseEventHandler<HTMLElement>;
  row: boolean;
  /** Row layout: the layer over the code the Store slides into */
  storeHost: HTMLElement | null;
  fixtures: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
}
