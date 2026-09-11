import type { Manager } from '@data-client/core';

import type { ProviderProps } from '../../../components/DataProvider.js';

export interface NextDataProviderProps extends Omit<
  ProviderProps,
  'initialState' | 'managers'
> {
  /**
   * Managers for the store. On the server every request needs its own
   * instances, so pass a factory when customizing them.
   * @see https://dataclient.io/docs/guides/ssr#managers
   */
  managers?: Manager[] | (() => Manager[]);
  /** Content-Security-Policy nonce applied to the inline scripts that stream state */
  nonce?: string;
}

export type StoreProviderProps = Omit<NextDataProviderProps, 'nonce'>;
