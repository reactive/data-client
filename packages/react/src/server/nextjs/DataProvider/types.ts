import type { Manager } from '@data-client/core';

import type { ProviderProps } from '../../../components/DataProvider.js';

export interface NextDataProviderProps extends Omit<
  ProviderProps,
  'initialState' | 'managers'
> {
  /**
   * Creates the store's Managers. Called once per request on the server and
   * once in the browser, since instances cannot be shared between requests.
   * @see https://dataclient.io/docs/guides/ssr#managers
   */
  managers?: () => Manager[];
  /** Content-Security-Policy nonce applied to the inline scripts that stream state */
  nonce?: string;
}

export type StoreProviderProps = Omit<NextDataProviderProps, 'nonce'>;
