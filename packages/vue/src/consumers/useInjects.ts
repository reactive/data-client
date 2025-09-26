import type { State } from '@data-client/core';
import type { ShallowRef } from 'vue';

import { injectController, injectState } from '../context.js';

export function useController() {
  return injectController();
}

export function useStateRef(): ShallowRef<State<unknown>> {
  return injectState();
}
