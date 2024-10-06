import { DataProvider } from '@data-client/react';

import makeRenderDataHook from './makeRenderDataClient/index.js';

/** Unit test hooks that rely on DataProvider
 *
 * @see https://dataclient.io/docs/api/renderDataHook
 */
export const renderDataHook = makeRenderDataHook(DataProvider);
