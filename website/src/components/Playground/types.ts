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

/** Where the preview and the Store go (../index.tsx): `row`, the preview
 * beside the code and the Store over it; `stacked`, the preview under the
 * code and the Store beside the app; `demo`, the preview first */
export type Layout = 'row' | 'stacked' | 'demo';

export interface PreviewProps<T = any> {
  storeOpen: boolean;
  /** Counts the reader's and demos' Store moves (`useStoreOpen`): the Store
   * animates only for these */
  storeMoves: number;
  toggleStore: ToggleStore;
  layout: Layout;
  /** Row layout: the layer over the code the Store slides into; stacked
   * too, while `narrow` */
  storeHost: HTMLElement | null;
  /** Narrower than the row's breakpoint (720px container width), where
   * the stacked layout collapses to the narrow row's */
  narrow: boolean;
  fixtures: FixtureOrInterceptor<T>[];
  getInitialInterceptorData?: () => T;
}
