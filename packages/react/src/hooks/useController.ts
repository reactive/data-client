import type { Controller } from '@data-client/core';

import use from './useUniversal.js';
import { ControllerContext } from '../context.js';

/**
 * Imperative control of Reactive Data Client store
 * @see https://dataclient.io/docs/api/useController
 */
export default function useController(): Controller {
  return use(ControllerContext);
}
