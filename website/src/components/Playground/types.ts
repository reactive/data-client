import type { Fixture, Interceptor } from '@data-client/test';

import type { ToggleStore } from './preview/StoreToggle';

export type FixtureOrInterceptor<T = any> = Fixture | Interceptor<T>;

/** The demo layout's code, as the preview's header shows it (../index.tsx) */
export interface CodeControl {
  /** The code shows in the result's place */
  shown: boolean;
  /** Shows or hides it (the header's Code toggle) */
  toggle: () => void;
}

export interface PreviewProps<T = any> {
  storeOpen: boolean;
  /** Counts the reader's and demos' Store moves (`useStoreOpen`): the Store
   * animates only for these */
  storeMoves: number;
  toggleStore: ToggleStore;
  row: boolean;
  /** Row layout: the layer over the code the Store slides into */
  storeHost: HTMLElement | null;
  fixtures: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
}
