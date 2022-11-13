import type { Controller } from '@rest-hooks/core';
import { useContext } from 'react';

import { ControllerContext } from '../context.js';

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/useController
 */
export default function useController(): Controller {
  return useContext(ControllerContext);
}
