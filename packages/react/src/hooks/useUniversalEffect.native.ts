import type { DependencyList, EffectCallback } from 'react';

import { default as useFocusEffect } from './useFocusEffect';

export function useUniveralEffect(
  effect: EffectCallback,
  deps?: DependencyList,
) {
  return useFocusEffect(effect, deps, true);
}
